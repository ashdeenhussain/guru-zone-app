const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(admin)', 'admin', 'finance', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
console.log('--- REPORTS TAB SEARCH ---');
lines.forEach((line, index) => {
    if (line.includes("activeTab === 'reports'") || (index >= 940 && index <= 1100)) {
        console.log(`${index + 1}: ${line}`);
    }
});
