const fs = require('fs');

try {
    const data = fs.readFileSync('dev_server.log', 'utf8');
    const lines = data.split('\n');
    console.log("Searching for debug lines...");
    let count = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (line.includes('Debug') || line.includes('finalize') || line.includes('Incoming')) {
            console.log(`${i}: ${line}`);
            count++;
            if (count > 50) break;
        }
    }
} catch (e) {
    console.error(e);
}
