const https = require('https');
const fs = require('fs');
const path = require('path');

const maps = [
    { name: 'Bermuda', url: 'https://static.wikia.nocookie.net/freefire/images/4/4b/Bermuda.png' },
    { name: 'Purgatory', url: 'https://static.wikia.nocookie.net/freefire/images/e/ef/Purgatory_map_small.jpg' },
    { name: 'Kalahari', url: 'https://static.wikia.nocookie.net/freefire/images/a/ab/Kalahari_map_clear.jpg' },
    { name: 'Alpine', url: 'https://static.wikia.nocookie.net/freefire/images/f/f3/Alpine_Map.jpg' },
    { name: 'Nexterra', url: 'https://static.wikia.nocookie.net/freefire/images/d/df/Nexterra_Map.png' }
];

const dir = path.join(__dirname, '..', 'public', 'maps');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

maps.forEach(map => {
    const req = https.get(map.url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
    }, (res) => {
        if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
            if (res.statusCode === 301 || res.statusCode === 302) {
                console.log(`Redirecting ${map.name} to ${res.headers.location}`);
                https.get(res.headers.location, (res2) => {
                    if (res2.statusCode === 200) {
                        res2.pipe(fs.createWriteStream(path.join(dir, `${map.name}.jpg`)));
                        console.log(`Downloaded ${map.name}.jpg (following redirect)`);
                    } else {
                        console.error(`Failed to download ${map.name}: ${res2.statusCode}`);
                    }
                });
            } else {
                res.pipe(fs.createWriteStream(path.join(dir, `${map.name}.jpg`)));
                console.log(`Downloaded ${map.name}.jpg`);
            }
        } else {
            console.error(`Failed to download ${map.name}: ${res.statusCode} from ${map.url}`);
        }
    });
    req.on('error', (e) => console.error(e));
});
