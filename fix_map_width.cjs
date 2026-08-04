const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
    /<div id="map-track" style="position: relative; height: 100%; aspect-ratio: 5760 \/ 1552; min-width: 100vw;">/g,
    '<div id="map-track" style="position: relative; height: 100%; width: max-content;">'
);

html = html.replace(
    /<img id="map-track-img" style="width: 100%; height: 100%; object-fit: fill; display: block; pointer-events: none;" \/>/g,
    '<img id="map-track-img" style="height: 100%; aspect-ratio: 5760 / 1552; display: block; pointer-events: none;" />'
);

fs.writeFileSync('index.html', html);
console.log("Map width fixed!");
