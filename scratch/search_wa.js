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
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(pattern)) {
                console.log(`Found pattern "${pattern}" in: ${fullPath}`);
            }
        }
    }
}

const srcDir = path.join(__dirname, '..', 'src');
console.log('Searching in:', srcDir);
console.log('--- guru_zone_wa_share_cooldowns ---');
searchDir(srcDir, 'guru_zone_wa_share_cooldowns');
console.log('--- sharedWithAdmins ---');
searchDir(srcDir, 'sharedWithAdmins');
