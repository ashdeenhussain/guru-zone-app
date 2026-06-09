const fs = require('fs');
const content = fs.readFileSync('src/app/(admin)/admin/tournaments/page.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 1630; i <= 1675; i++) {
    console.log(`${i}: ${lines[i-1]}`);
}
