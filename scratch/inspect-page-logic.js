const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(admin)', 'admin', 'finance', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
console.log('--- STATE & FETCH DATA ---');
for (let i = 59; i < 210; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
