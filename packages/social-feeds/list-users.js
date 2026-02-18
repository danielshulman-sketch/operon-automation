const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany();
        console.log("Users in database:", users.length);
        users.forEach(user => {
            console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, HasPassword: ${!!user.password}`);
        });
    } catch (error) {
        console.error("Error fetching users:", error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
