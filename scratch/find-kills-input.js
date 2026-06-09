const fs = require('fs');
const content = fs.readFileSync('src/app/(admin)/admin/tournaments/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('killsState') || line.includes('setKillsState') || line.includes('kills[')) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
});
