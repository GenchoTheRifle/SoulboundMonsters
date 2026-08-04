const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Use a regex to match the entire map-nodes block
const mapNodesRegex = /<div id="map-nodes".*?<\/div>\s*<\/div>\s*<\/div>/s;

const newMapNodes = `<div id="map-nodes" class="map-nodes" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow-x: auto; overflow-y: hidden; z-index: 1;">
    <div id="map-track" style="position: relative; height: 100%; width: max-content;">
        <img id="map-track-img" style="height: 100%; aspect-ratio: 5760 / 1552; width: auto; display: block; pointer-events: none;" />
        <div id="map-nodes-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
    </div>
</div>`;

html = html.replace(/<div id="map-nodes" class="map-nodes"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, newMapNodes);

fs.writeFileSync('index.html', html);
console.log("Map layout fixed!");
