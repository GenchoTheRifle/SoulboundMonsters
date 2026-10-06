const fs = require('fs');

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(
    /id="map-track" style="position: absolute; top: 0; left: 0; height: 100%; transition: transform 1\.5s ease-in-out;"/,
    `id="map-track" style="position: absolute; top: 0; left: 0; height: 100%; aspect-ratio: 5760 / 1552; transition: transform 1.5s ease-in-out;"`
);
fs.writeFileSync('index.html', indexHtml);

let mapJs = fs.readFileSync('src/map.js', 'utf8');
mapJs = mapJs.replace(
    /const viewportWidth = mapNodes\.offsetWidth;[\s\S]*?track\.style\.transform = \`translateX\(\$\{translateX\}px\)\`;/m,
    `const viewportWidth = mapNodes.offsetWidth;
                    const trackWidth = track.offsetWidth || (mapNodes.offsetHeight * (5760 / 1552));
                    
                    const pos = MAP_NODE_POSITIONS[currentRun.nodeIndex] || { x: 0.5 };
                    let targetX = pos.x * trackWidth;
                    
                    // Center the targetX in the viewport
                    let translateX = (viewportWidth / 2) - targetX;
                    
                    // Clamp it so we don't scroll past the edges
                    translateX = Math.max(viewportWidth - trackWidth, Math.min(0, translateX));
                    
                    track.style.transform = \`translateX(\${translateX}px)\`;`
);
fs.writeFileSync('src/map.js', mapJs);
console.log("Patched track aspect ratio!");
