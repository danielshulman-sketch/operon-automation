const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promote() {
    const email = "daniel.shulman@gmail.com";
    console.log(`Promoting ${email} to admin...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'admin' },
        });
        console.log(`User ${user.email} is now an ${user.role}.`);
    } catch (error) {
        console.error("Failed to promote user:", error);
    } finally {
        await prisma.$disconnect();
    }
}

promote();
