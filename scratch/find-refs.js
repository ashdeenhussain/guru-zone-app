const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(admin)', 'admin', 'finance', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

content.split('\n').forEach((line, index) => {
    if (line.includes("activeTab === 'reports'") && line.includes('stats')) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
