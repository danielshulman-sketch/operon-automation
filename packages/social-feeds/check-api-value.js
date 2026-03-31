const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserData() {
    try {
        const users = await prisma.user.findMany();

        users.forEach(u => {
            console.log(`\nUser: ${u.email}`);
            console.log(`- ID: ${u.id}`);
            console.log(`- OpenAI Key: "${u.openaiApiKey}" (Length: ${u.openaiApiKey?.length || 0})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUserData();
