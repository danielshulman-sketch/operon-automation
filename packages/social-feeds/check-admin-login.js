require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkLogin() {
    const email = "daniel.shulman@gmail.com";
    const password = "password123";

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log("User not found in DB");
            return;
        }

        console.log("User found in DB:", user.email);
        const isValid = await bcrypt.compare(password, user.password);
        console.log("Password valid:", isValid);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLogin();
