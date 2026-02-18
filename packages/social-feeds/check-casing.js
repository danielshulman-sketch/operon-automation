const fs = require('fs');
const path = require('path');
const glob = require('glob'); // You might need to install this if not available, or use recursive readdir

// Simple recursive directory walker
function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                getFiles(filePath, fileList);
            }
        } else {
            if (/\.(ts|tsx|js|jsx)$/.test(file)) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const srcDir = path.resolve(__dirname, 'src');
const allFiles = getFiles(srcDir);

console.log(`Checking ${allFiles.length} files for case sensitivity issues...`);

let issuesFound = 0;

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Match import ... from '...' and import(...)
    const regex = /from\s+['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const importPath = match[1] || match[2];

        if (importPath.startsWith('.')) {
            const dir = path.dirname(file);
            const absoluteImportPath = path.resolve(dir, importPath);

            // Check if file exists (ignoring extension for now to find the file)
            const dirName = path.dirname(absoluteImportPath);
            const fileName = path.basename(absoluteImportPath);

            if (fs.existsSync(dirName)) {
                const actualFiles = fs.readdirSync(dirName);

                // Find match ignoring case
                const exactMatch = actualFiles.find(f => f === fileName || f.startsWith(fileName + '.'));
                const caseInsensitiveMatch = actualFiles.find(f => f.toLowerCase() === fileName.toLowerCase() || f.toLowerCase().startsWith(fileName.toLowerCase() + '.'));

                if (caseInsensitiveMatch) {
                    // If we found a file, let's check exact casing of the base name
                    // This is a rough check. strict would be to check the whole path.
                    // But usually the issue is in the filename itself.

                    // Check if the import part matches the actual file part
                    const actualNameWithoutExt = caseInsensitiveMatch.replace(/\.[^/.]+$/, "");
                    // importPath might be "../components/Sidebar"
                    // fileName might be "Sidebar"

                    // This is tricky because imports don't have extensions usually.

                    if (fileName !== actualNameWithoutExt && fileName.toLowerCase() === actualNameWithoutExt.toLowerCase()) {
                        console.error(`[CASE MISMATCH] In ${path.relative(process.cwd(), file)}:`);
                        console.error(`  Imported: ${importPath}`);
                        console.error(`  Actual:   ${caseInsensitiveMatch}`);
                        issuesFound++;
                    }
                }
            }
        }
    }
});

if (issuesFound === 0) {
    console.log("No obvious case sensitivity issues found in relative imports.");
} else {
    console.log(`Found ${issuesFound} potential case sensitivity issues.`);
}
