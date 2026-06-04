const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(admin)', 'admin', 'finance', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

// Print imports, and state, and sections around table
const lines = content.split('\n');
console.log('--- IMPORTS ---');
for (let i = 0; i < 65; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}

console.log('\n--- SECTIONS SEARCH ---');
lines.forEach((line, index) => {
    if (line.includes('return (') || line.includes('className="grid') || line.includes('<h2>') || line.includes('<h3>') || line.includes('<h2') || line.includes('<h3') || line.includes('Profit Table')) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
