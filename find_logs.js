const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (!['node_modules', '.next', '.git'].includes(file)) {
                results = results.concat(walk(filePath));
            }
        } else {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));
console.log(`Found ${files.length} TypeScript files. Searching for 'FinancialLog'...`);

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('FinancialLog')) {
        console.log(`\n--- Match in file: ${file} ---`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.includes('FinancialLog') || line.includes('financiallog')) {
                console.log(`${idx + 1}: ${line.trim()}`);
            }
        });
    }
});
