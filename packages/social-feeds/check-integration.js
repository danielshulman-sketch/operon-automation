const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserData() {
    try {
        const users = await prisma.user.findMany({
            include: { externalConnections: true }
        });

        const data = users.map(u => ({
            email: u.email,
            id: u.id,
            openaiKeyLen: u.openaiApiKey ? u.openaiApiKey.length : 0,
            linkedinClientLen: u.linkedinClientId ? u.linkedinClientId.length : 0,
            connections: u.externalConnections.map(c => ({
                provider: c.provider,
                name: c.name,
                credLen: c.credentials ? c.credentials.length : 0,
                credValue: c.credentials
            }))
        }));
        
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUserData();
