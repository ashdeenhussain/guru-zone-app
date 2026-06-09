const fs = require('fs');
const content = fs.readFileSync('src/app/(admin)/admin/tournaments/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (idx + 1 >= 922 && idx + 1 <= 1250 && line.includes('StatusBadge')) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
});
