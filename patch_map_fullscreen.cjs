const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');

const target = `<div id="screen-map" class="screen" style="flex-direction: column; align-items: center; justify-content: center; position: relative;">
            <button id="btn-pause-map" onclick="openPauseModal()" style="position: absolute; top: 20px; left: 20px; z-index: 100; font-size: 50px; padding: 0; background: none; border: none; color: white; cursor: pointer; filter: drop-shadow(2px 2px 4px black);"><img src="Art/Settings.png" style="width: 70px; height: 70px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.8));" alt="Settings" /></button>
            <h2 style="margin-top: 20px;">THE RUN</h2>
            <div id="map-nodes" class="map-nodes" style="flex: 1; position: relative; overflow: hidden; width: 100%; margin: 20px 0; border: 2px solid #444; border-radius: 10px;">
                <div id="map-track" style="position: absolute; top: 0; left: 0; height: 100%; aspect-ratio: 5760 / 1552; transition: transform 1.5s ease-in-out;">
                    <img id="map-track-img" style="height: 100%; display: block; pointer-events: none;" />
                    <div id="map-nodes-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
                </div>
            </div>
            
            <div style="display: flex; gap: 30px; width: 100%; max-width: 600px; margin-bottom: 20px;">
                <button onclick="openMapTeamModal()" style="flex: 1; padding: 15px; font-size: 18px;">TEAM</button>
                <button id="btn-continue-node" onclick="proceedToNode()" style="flex: 1; padding: 15px; font-size: 18px;">CONTINUE</button>
            </div>
        </div>`;

const replacement = `<div id="screen-map" class="screen" style="flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 0;">
            <button id="btn-pause-map" onclick="openPauseModal()" style="position: absolute; top: 20px; left: 20px; z-index: 100; font-size: 50px; padding: 0; background: none; border: none; color: white; cursor: pointer; filter: drop-shadow(2px 2px 4px black);"><img src="Art/Settings.png" style="width: 70px; height: 70px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.8));" alt="Settings" /></button>
            <h2 style="position: absolute; top: 20px; z-index: 10; margin: 0; text-shadow: 2px 2px 5px black;">THE RUN</h2>
            <div id="map-nodes" class="map-nodes" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 1;">
                <div id="map-track" style="position: absolute; top: 0; left: 0; height: 100%; aspect-ratio: 5760 / 1552; transition: transform 1.5s ease-in-out;">
                    <img id="map-track-img" style="height: 100%; display: block; pointer-events: none;" />
                    <div id="map-nodes-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
                </div>
            </div>
            
            <div style="position: absolute; bottom: 20px; z-index: 10; display: flex; gap: 30px; width: 100%; max-width: 600px; padding: 0 20px; box-sizing: border-box;">
                <button onclick="openMapTeamModal()" style="flex: 1; padding: 15px; font-size: 18px; filter: drop-shadow(0 0 5px black);">TEAM</button>
                <button id="btn-continue-node" onclick="proceedToNode()" style="flex: 1; padding: 15px; font-size: 18px; filter: drop-shadow(0 0 5px black);">CONTINUE</button>
            </div>
        </div>`;

indexHtml = indexHtml.replace(target, replacement);
fs.writeFileSync('index.html', indexHtml);
console.log("Patched fullscreen map!");
