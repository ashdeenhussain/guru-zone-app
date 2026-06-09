const fs = require('fs');
const content = fs.readFileSync('src/app/(admin)/admin/tournaments/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('function StatusBadge') || line.includes('const StatusBadge')) {
        console.log(`StatusBadge defined at line ${idx + 1}: ${line}`);
        // print next 25 lines
        for (let i = 0; i < 25; i++) {
            console.log(`${idx + 1 + i}: ${lines[idx + i]}`);
        }
    }
});
