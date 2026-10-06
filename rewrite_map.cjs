const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const mapScreenRegex = /<div id="screen-map" class="screen"[\s\S]*?<!-- Combat -->/;
const newMapScreen = `<div id="screen-map" class="screen" style="flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 0; overflow: hidden; background-color: #000;">
    <button id="btn-pause-map" onclick="openPauseModal()" style="position: absolute; top: 20px; left: 20px; z-index: 100; font-size: 50px; padding: 0; background: none; border: none; color: white; cursor: pointer; filter: drop-shadow(2px 2px 4px black);">
        <img src="Art/Settings.png" style="width: 70px; height: 70px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.8));" alt="Settings" />
    </button>
    
    <h2 style="position: absolute; top: 20px; z-index: 10; margin: 0; text-shadow: 2px 2px 5px black; left: 50%; transform: translateX(-50%); font-size: 40px; color: white;">THE RUN</h2>
    
    <div id="map-nodes" class="map-nodes" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow-x: auto; overflow-y: hidden; z-index: 1; scroll-behavior: smooth;">
        <div id="map-track" style="position: relative; height: 100%; width: max-content;">
            <img id="map-track-img" style="height: 100%; width: auto; object-fit: contain; display: block; pointer-events: none;" />
            <div id="map-nodes-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
        </div>
    </div>
    
    <div style="position: absolute; bottom: 20px; z-index: 10; display: flex; gap: 30px; width: 100%; max-width: 600px; padding: 0 20px; box-sizing: border-box; left: 50%; transform: translateX(-50%);">
        <button onclick="openMapTeamModal()" style="flex: 1; padding: 15px; font-size: 24px; filter: drop-shadow(0 0 5px black);">TEAM FORMATION</button>
        <button id="btn-continue-node" onclick="proceedToNode()" style="flex: 1; padding: 15px; font-size: 24px; filter: drop-shadow(0 0 5px black);">CONTINUE</button>
    </div>
</div>

<!-- Combat -->`;
html = html.replace(mapScreenRegex, newMapScreen);
fs.writeFileSync('index.html', html);
console.log("Rewrote map screen");
