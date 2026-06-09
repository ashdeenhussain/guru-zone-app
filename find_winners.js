const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            filelist = walk(filepath, filelist);
        } else {
            if (filepath.endsWith('.tsx') || filepath.endsWith('.ts') || filepath.endsWith('.js')) {
                filelist.push(filepath);
            }
        }
    });
    return filelist;
}

const files = walk('d:/Users/ashde/Downloads/ashi/clon of zp/guru-zone/src');
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('winners?.rank1') || content.includes('winners.rank1')) {
        console.log(`Found in: ${file}`);
    }
});
