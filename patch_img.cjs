const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(
    /<img id="map-track-img" style="height: 100%; display: block; pointer-events: none;" \/>/,
    `<img id="map-track-img" style="width: 100%; height: 100%; object-fit: fill; display: block; pointer-events: none;" />`
);
fs.writeFileSync('index.html', indexHtml);
