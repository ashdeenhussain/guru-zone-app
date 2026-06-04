const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(admin)', 'admin', 'finance', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
console.log('--- FIND SUBSECTIONS ---');
lines.forEach((line, index) => {
    if (line.includes('Cards') || line.includes('Profit Table') || line.includes('User Performance Table') || line.includes('Ledger Modal') || line.includes('REVIEW MODAL')) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
