const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
    let out = '';
    try {
        const u = await prisma.user.findFirst({
            where: { email: 'daniel.shulman@gmail.com' },
            include: { externalConnections: true }
        });
        
        out += "=== USER ===\n";
        out += "OpenAI: " + u.openaiApiKey + "\n";
        out += "Ext Connections Count: " + u.externalConnections.length + "\n";
        u.externalConnections.forEach(c => {
             out += `\nConnection ID: ${c.id}\n`;
             out += `Provider: ${c.provider}\n`;
             out += `Creds parsing: ` + JSON.stringify(JSON.parse(c.credentials)) + `\n`;
        });
    } catch (e) {
        out += String(e);
    } finally {
        await prisma.$disconnect();
    }
    fs.writeFileSync('result-utf8.txt', out, 'utf8');
}
run();
