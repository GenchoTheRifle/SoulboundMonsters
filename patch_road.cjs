const fs = require('fs');

let stateJs = fs.readFileSync('src/state.js', 'utf8');
stateJs = stateJs.replace(
    /function getMapBackground\(arcId\) \{/,
    `function getMapRoadBackground(arcId) {
            if (arcId === 'arc2') return "url('Art/Forest Road.png')";
            if (arcId === 'arc3') return "url('Art/Laboratory Road.png')";
            return "url('Art/Cave Road.png')";
        }

        function getMapBackground(arcId) {`
);
fs.writeFileSync('src/state.js', stateJs);

let mapJs = fs.readFileSync('src/map.js', 'utf8');
mapJs = mapJs.replace(
    /const bgElement = document.getElementById\('map-bg'\);\s*if \(bgElement && currentRun.arcId\) bgElement.style.backgroundImage = getMapBackground\(currentRun.arcId\);/,
    `const screenMap = document.getElementById('screen-map');
            if (screenMap && currentRun.arcId) {
                screenMap.style.background = getMapRoadBackground(currentRun.arcId) + ' center/cover';
            }`
);
fs.writeFileSync('src/map.js', mapJs);
console.log("Patched road backgrounds!");
