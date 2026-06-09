const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '..', 'src', 'components', 'TournamentDetailsClient.tsx');
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.includes('isPerKill')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
