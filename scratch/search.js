const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walk(dir, results = []) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            walk(fullPath, results);
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(srcDir);
console.log(`Found ${files.length} files in src/`);

const matches = [];

files.forEach(file => {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js') && !file.endsWith('.jsx')) return;
    const content = fs.readFileSync(file, 'utf8');
    
    // Search for setInterval
    if (content.includes('setInterval')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.includes('setInterval')) {
                matches.push({ file: path.relative(srcDir, file), line: idx + 1, type: 'setInterval', text: line.trim() });
            }
        });
    }

    // Search for revalidate or fetch cache options
    if (content.includes('revalidate') || content.includes('getServerSideProps')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.includes('revalidate') || line.includes('getServerSideProps')) {
                matches.push({ file: path.relative(srcDir, file), line: idx + 1, type: 'cache/revalidate', text: line.trim() });
            }
        });
    }
});

console.log(JSON.stringify(matches, null, 2));
