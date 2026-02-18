const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
    const email = "daniel.shulman@gmail.com";
    const newPassword = "password123";

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'admin' // Ensure they are admin
            },
            create: {
                email,
                name: "Daniel Shulman",
                password: hashedPassword,
                role: 'admin'
            }
        });

        console.log(`User ${user.email} updated.`);
        console.log(`Role: ${user.role}`);
        console.log(`Password reset to: ${newPassword}`);

    } catch (error) {
        console.error("Failed to reset password:", error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
