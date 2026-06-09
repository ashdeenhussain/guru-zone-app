const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, pattern);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.mjs'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(pattern)) {
          console.log(`Found pattern in: ${fullPath}`);
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(pattern)) {
              console.log(`  Line ${i + 1}: ${lines[i].trim().substring(0, 150)}`);
            }
          }
        }
      } catch (err) {
        // ignore read errors
      }
    }
  }
}

const targetDir = path.join(__dirname, '../node_modules/next');
console.log(`Searching in ${targetDir}...`);
searchDir(targetDir, 'flushComponentPerformance');
console.log('Search complete.');
