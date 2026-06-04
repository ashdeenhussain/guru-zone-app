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
            if (line.includes('CSV') || line.includes('csv') || line.includes('exportTo') || line.includes('download')) {
                // Ignore files that are in node_modules or build outputs, but we are only walking src
                console.log(`${path.relative(srcDir, filePath)}:${index + 1}: ${line.trim()}`);
            }
        });
    }
});
