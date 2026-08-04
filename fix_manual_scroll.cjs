const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
    /<div id="map-nodes" class="map-nodes" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 1;">/g,
    '<div id="map-nodes" class="map-nodes" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow-x: auto; overflow-y: hidden; z-index: 1;">'
);
// Remove absolute position from map-track so it can scroll properly inside the container
html = html.replace(
    /<div id="map-track" style="position: absolute; top: 0; left: 0; height: 100%; aspect-ratio: 5760 \/ 1552; transition: transform 1\.5s ease-in-out;">/g,
    '<div id="map-track" style="position: relative; height: 100%; aspect-ratio: 5760 / 1552;">'
);
fs.writeFileSync('index.html', html);

let js = fs.readFileSync('src/map.js', 'utf8');
// Fix the auto scroll logic to use scrollLeft instead of transform
js = js.replace(
    /track\.style\.transform = \`translateX\(\$\{translateX\}px\)\`;/g,
    `mapNodes.scrollTo({ left: -translateX, behavior: 'smooth' });`
);
fs.writeFileSync('src/map.js', js);
console.log("Fixed manual scroll!");
