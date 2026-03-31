const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    try {
        const u = await prisma.user.findFirst({
            where: { email: 'daniel.shulman@gmail.com' },
            include: { externalConnections: true }
        });
        
        let openAiKey = null;
        let linkedinId = null;

        for (const conn of u.externalConnections) {
            if (conn.provider === 'linkedin') {
                const creds = JSON.parse(conn.credentials);
                if (creds.accessToken && creds.accessToken.startsWith('sk-')) {
                    openAiKey = creds.accessToken;
                    linkedinId = conn.id;
                }
            }
        }

        if (openAiKey) {
            console.log("Found OpenAI key saved inside LinkedIn connection! Moving it...");
            await prisma.user.update({
                where: { id: u.id },
                data: { openaiApiKey: openAiKey }
            });
            console.log("Saved OpenAI API key properly.");

            await prisma.externalConnection.delete({
                where: { id: linkedinId }
            });
            console.log("Deleted the invalid LinkedIn connection.");
        } else {
            console.log("No key to migrate found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
fix();
