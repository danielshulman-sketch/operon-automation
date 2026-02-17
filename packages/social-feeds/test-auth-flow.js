const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function test() {
    const email = "test-auth-" + Date.now() + "@example.com";
    const password = "password123";

    console.log("1. Testing Registration...");
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                name: "Test User",
                password: hashedPassword,
            },
        });
        console.log("   User created successfully:", user.id);
    } catch (error) {
        console.error("   Registration failed:", error);
        return;
    }

    console.log("2. Testing Login Verification (Direct DB)...");
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error("   Login failed: User not found");
            return;
        }
        const isValid = await bcrypt.compare(password, user.password);
        console.log("   Password valid:", isValid);

        console.log("3. Testing Login API Endpoint...");
        try {
            // Get CSRF Token
            const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
            const csrfData = await csrfRes.json();
            const csrfToken = csrfData.csrfToken;
            console.log("   CSRF Token:", csrfToken);

            // Extract cookie
            const cookie = csrfRes.headers.get("set-cookie");
            console.log("   Cookie:", cookie);

            // Login
            const params = new URLSearchParams();
            params.append('email', email);
            params.append('password', password);
            params.append('csrfToken', csrfToken);
            params.append('json', 'true');

            const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": cookie
                },
                body: params
            });

            console.log("   Login Status:", loginRes.status);
            const loginText = await loginRes.text();
            console.log("   Login Response:", loginText);

        } catch (err) {
            console.error("   API Login failed:", err);
        }

    } catch (error) {
        console.error("   Login verification failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
