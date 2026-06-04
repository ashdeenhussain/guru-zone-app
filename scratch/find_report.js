const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                searchDir(fullPath, pattern);
            }
        } else {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(pattern)) {
                console.log(`Found pattern in: ${fullPath}`);
            }
        }
    }
}

const srcDir = path.join(__dirname, '..', 'src');
console.log(`Searching for '/api/finance/report' in: ${srcDir}`);
searchDir(srcDir, '/api/finance/report');
console.log('Search finished.');
