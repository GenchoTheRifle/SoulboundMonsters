const fs = require('fs');

let mapJs = fs.readFileSync('src/map.js', 'utf8');

mapJs = mapJs.replace(
    /if \(i < currentRun\.nodes\.length - 1\) \{[\s\S]*?nodeWrapper\.appendChild\(line\);\s*\}/m,
    `// removed node lines`
);

mapJs = mapJs.replace(
    /\/\/ Auto-scroll to current node[\s\S]*?\}, 100\);/m,
    `// Auto-scroll to current node
            setTimeout(() => {
                const mapNodes = document.getElementById('map-nodes');
                const track = document.getElementById('map-track');
                if (mapNodes && track) {
                    // mapNodes width is viewport width
                    const viewportWidth = mapNodes.offsetWidth;
                    // track width is its height * 3.7113
                    const trackWidth = mapNodes.offsetHeight * (5760 / 1552);
                    
                    track.style.width = \`\${trackWidth}px\`;
                    
                    const pos = MAP_NODE_POSITIONS[currentRun.nodeIndex] || { x: 0.5 };
                    let targetX = pos.x * trackWidth;
                    
                    // Center the targetX in the viewport
                    let translateX = (viewportWidth / 2) - targetX;
                    
                    // Clamp it so we don't scroll past the edges
                    translateX = Math.max(viewportWidth - trackWidth, Math.min(0, translateX));
                    
                    track.style.transform = \`translateX(\${translateX}px)\`;
                }
            }, 100);`
);

fs.writeFileSync('src/map.js', mapJs);
console.log("Patched lines and auto-scroll!");
