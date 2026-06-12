const fs = require('fs');
const path = require('path');

function searchFile(filePath, pattern) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        if (line.includes(pattern)) {
            console.log(`${path.basename(filePath)}:L${idx + 1}: ${line.trim()}`);
        }
    });
}

const compsDir = path.join(__dirname, '..', 'src', 'components', 'battle-zone');
searchFile(path.join(compsDir, 'HostControls.tsx'), 'roomID');
searchFile(path.join(compsDir, 'HostControls.tsx'), 'roomPassword');
console.log('---');
searchFile(path.join(compsDir, 'PlayerControls.tsx'), 'roomID');
searchFile(path.join(compsDir, 'PlayerControls.tsx'), 'roomPassword');
