const fs = require('fs');

let mapJs = fs.readFileSync('src/map.js', 'utf8');

mapJs = mapJs.replace(
    /const screenMap = document.getElementById\('screen-map'\);\s*if \(screenMap && currentRun\.arcId\) \{\s*screenMap\.style\.background = getMapRoadBackground\(currentRun\.arcId\) \+ ' center\/cover';\s*\}/,
    `const screenMap = document.getElementById('screen-map');
            if (screenMap && currentRun.arcId) {
                const totalNodes = currentRun.nodes.length;
                const progress = currentRun.nodeIndex / Math.max(1, totalNodes - 1);
                screenMap.style.background = getMapRoadBackground(currentRun.arcId);
                screenMap.style.backgroundSize = 'auto 100%';
                screenMap.style.backgroundPosition = \`\${progress * 100}% center\`;
                screenMap.style.transition = 'background-position 1.5s ease-in-out';
            }`
);

fs.writeFileSync('src/map.js', mapJs);
console.log("Patched map background scrolling!");
