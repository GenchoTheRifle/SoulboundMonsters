const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<div id="map-track" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">/g, 
    '<div id="map-track" style="position: absolute; top: 0; left: 0; height: 100%; aspect-ratio: 5760 / 1552; transition: transform 1.5s ease-in-out;">');
html = html.replace(/<img id="map-track-img" style="width: 100%; height: 100%; object-fit: fill; display: block; pointer-events: none;" \/>/g,
    '<img id="map-track-img" style="width: 100%; height: 100%; display: block; pointer-events: none;" />');
fs.writeFileSync('index.html', html);

let mapJs = fs.readFileSync('src/map.js', 'utf8');
mapJs = mapJs.replace(
    /\/\/ mapNodes width is viewport width\s*\}/g,
    `const viewportWidth = mapNodes.offsetWidth;
                    const trackWidth = track.offsetWidth || (mapNodes.offsetHeight * (5760 / 1552));
                    
                    const pos = MAP_NODE_POSITIONS[currentRun.nodeIndex] || { x: 0.5 };
                    let targetX = pos.x * trackWidth;
                    
                    // Center the targetX in the viewport
                    let translateX = (viewportWidth / 2) - targetX;
                    
                    // Clamp it so we don't scroll past the edges
                    translateX = Math.max(viewportWidth - trackWidth, Math.min(0, translateX));
                    
                    track.style.transform = \`translateX(\${translateX}px)\`;
                }`
);
fs.writeFileSync('src/map.js', mapJs);
console.log("Fixed map scrolling!");
