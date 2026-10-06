const fs = require('fs');

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(
    /<div id="map-nodes" class="map-nodes" style="flex: 1; display: flex; align-items: center; overflow-x: auto; overflow-y: hidden; width: 100%; max-width: 800px;"><\/div>/,
    `<div id="map-nodes" class="map-nodes" style="flex: 1; position: relative; overflow: hidden; width: 100%; margin: 20px 0; border: 2px solid #444; border-radius: 10px;">
                <div id="map-track" style="position: absolute; top: 0; left: 0; height: 100%; transition: transform 1.5s ease-in-out;">
                    <img id="map-track-img" style="height: 100%; display: block; pointer-events: none;" />
                    <div id="map-nodes-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
                </div>
            </div>`
);
fs.writeFileSync('index.html', indexHtml);

let mapJs = fs.readFileSync('src/map.js', 'utf8');
mapJs = mapJs.replace(
    /const screenMap = document.getElementById\('screen-map'\);[\s\S]*?container\.innerHTML = '';/m,
    `const screenMap = document.getElementById('screen-map');
            if (screenMap && currentRun.arcId) {
                // Remove background from screenMap
                screenMap.style.background = 'none';
            }

            const trackImg = document.getElementById('map-track-img');
            if (trackImg && currentRun.arcId) {
                let bgPath = getMapRoadBackground(currentRun.arcId);
                // Extract url path from url('...')
                let match = bgPath.match(/url\\('?([^']*)'?\\)/);
                if (match && match[1]) {
                    trackImg.src = match[1];
                }
            }

            const container = document.getElementById('map-nodes-container');
            if (!container) return;
            container.innerHTML = '';`
);
fs.writeFileSync('src/map.js', mapJs);
console.log("Patched HTML and map.js init!");
