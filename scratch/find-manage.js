const fs = require('fs');
const content = fs.readFileSync('src/app/(admin)/admin/tournaments/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('function ManageTournamentView') || line.includes('const ManageTournamentView')) {
        console.log(`ManageTournamentView defined at line ${idx + 1}: ${line}`);
        // print next 100 lines
        for (let i = 0; i < 100; i++) {
            console.log(`${idx + 1 + i}: ${lines[idx + i]}`);
        }
    }
});
