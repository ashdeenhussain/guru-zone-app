const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(admin)', 'admin', 'finance', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
console.log('--- LAYOUT LINES ---');
for (let i = 290; i < 430; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
