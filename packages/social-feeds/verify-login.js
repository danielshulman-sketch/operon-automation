const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyLogin() {
    const email = "daniel.shulman@gmail.com";
    const password = "password123";

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log("User not found via Prisma.");
            return;
        }

        console.log("User found:", user.email);
        console.log("Stored Hash:", user.password);

        const isValid = await bcrypt.compare(password, user.password);
        console.log(`Password '${password}' is valid: ${isValid}`);

    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyLogin();
