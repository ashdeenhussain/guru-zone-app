const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

const srcDir = path.join(__dirname, '..', 'src');
walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (line.includes('type:') && (line.includes('deposit') || line.includes('withdrawal') || line.includes('free') || line.includes('ADJUSTMENT') || line.includes('spin') || line.includes('reward'))) {
                console.log(`${path.relative(srcDir, filePath)}:${index + 1}: ${line.trim()}`);
            }
        });
    }
});
