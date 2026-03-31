const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            walk(full);
        } else if (f === 'page.tsx' || f === 'layout.tsx') {
            let content = fs.readFileSync(full, 'utf8');
            content = content.replace(/^\uFEFF/, '');
            content = content.replace(/^export const dynamic = 'force-dynamic';\r?\n/, '');
            const useClientMatch = content.match(/^(['"]use client['"];?\r?\n)/);
            const useServerMatch = content.match(/^(['"]use server['"];?\r?\n)/);
            if (useClientMatch) {
                content = useClientMatch[1] + "export const dynamic = 'force-dynamic';\n" + content.slice(useClientMatch[1].length);
            } else if (useServerMatch) {
                content = useServerMatch[1] + "export const dynamic = 'force-dynamic';\n" + content.slice(useServerMatch[1].length);
            } else {
                content = "export const dynamic = 'force-dynamic';\n" + content;
            }
            fs.writeFileSync(full, content);
            console.log('Fixed:', full);
        }
    }
}

walk(path.join(__dirname, 'src', 'app'));
console.log('Done');
