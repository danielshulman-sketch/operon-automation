const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'daniel.shulman@gmail.com';
    const newPassword = 'OperonLogin!2026';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        console.log(`Updating password for ${email}...`);
        const user = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log("Password updated successfully.");
    } catch (e) {
        console.error("Error updating password:", e);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
