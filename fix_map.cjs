const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const mapScreenRegex = /<div id="screen-map" class="screen"[\s\S]*?<!-- Combat -->/;
const newMapScreen = `<div id="screen-map" class="screen" style="flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 0; overflow: hidden; background-color: #000;">
    <button id="btn-pause-map" onclick="openPauseModal()" style="position: absolute; top: 20px; left: 20px; z-index: 100; font-size: 50px; padding: 0; background: none; border: none; color: white; cursor: pointer; filter: drop-shadow(2px 2px 4px black);">
        <img src="Art/Settings.png" style="width: 70px; height: 70px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.8));" alt="Settings" />
    </button>
    
    <h2 style="position: absolute; top: 20px; z-index: 10; margin: 0; text-shadow: 2px 2px 5px black; left: 50%; transform: translateX(-50%); font-size: 40px; color: white;">THE RUN</h2>
    
    <div id="map-nodes" class="map-nodes" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow-x: auto; overflow-y: hidden; z-index: 1; scroll-behavior: smooth;">
        <div id="map-track" style="position: relative; height: 100%; aspect-ratio: 5760 / 1552;">
            <img id="map-track-img" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; display: block; pointer-events: none;" />
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
console.log("Rewrote map screen for tracking aspect ratio");

let mapJs = fs.readFileSync('src/map.js', 'utf8');
const oldNodesLoopRegex = /currentRun\.nodes\.forEach\(\(n, i\) => \{[\s\S]*?\}\);\s*document\.getElementById\('btn-continue-node'\)/;
const newNodesLoop = `currentRun.nodes.forEach((n, i) => {
                const pos = MAP_NODE_POSITIONS[i] || { x: 0.5, y: 0.5 };
                const nodeWrapper = document.createElement('div');
                nodeWrapper.className = 'node-container';
                nodeWrapper.style.position = 'absolute';
                nodeWrapper.style.left = \`\${pos.x * 100}%\`;
                nodeWrapper.style.top = \`\${pos.y * 100}%\`;
                nodeWrapper.style.transform = 'translate(-50%, -50%)';
                nodeWrapper.style.display = 'flex';
                nodeWrapper.style.flexDirection = 'column';
                nodeWrapper.style.alignItems = 'center';
                
                // Hide nodes that are beyond the next upcoming one
                if (i > currentRun.nodeIndex + 1) {
                    nodeWrapper.style.display = 'none';
                }

                const div = document.createElement('div');
                div.className = \`node \${i === currentRun.nodeIndex ? 'active' : ''} \${i < currentRun.nodeIndex ? 'completed' : ''}\`;
                let iconSrc = '';
                let nodeText = '';
                if (n.type === 'boss') {
                    iconSrc = 'Art/Boss_Icon.png';
                    nodeText = 'Boss';
                } else if (n.type === 'combat') {
                    iconSrc = 'Art/Fight_Icon.png';
                    nodeText = 'Battle';
                } else {
                    iconSrc = 'Art/Fight_Icon.png'; // placeholder for merge per user request
                    nodeText = 'Merge';
                }
                
                const isCompleted = i < currentRun.nodeIndex;
                const isActive = i === currentRun.nodeIndex;
                const isUpcoming = i > currentRun.nodeIndex;

                let filterStr = '';
                let textColor = 'white';

                if (isCompleted) {
                    filterStr = 'grayscale(100%) brightness(50%) drop-shadow(0 0 15px lime)';
                    textColor = '#22c55e'; // Green
                } else if (isActive) {
                    filterStr = 'drop-shadow(0 0 15px yellow)';
                    textColor = 'yellow';
                } else if (isUpcoming) {
                    if (n.type === 'merge') {
                        filterStr = 'drop-shadow(0 0 15px #3b82f6)';
                        textColor = '#3b82f6'; // Blue
                    } else {
                        filterStr = 'drop-shadow(0 0 15px red)';
                        textColor = 'red';
                    }
                }

                div.innerHTML = \`
                    <div style="position:absolute; top:-35px; left:50%; transform:translateX(-50%); color:\${textColor}; font-size:24px; font-weight:bold; text-shadow:2px 2px 2px black, 0 0 5px black; white-space:nowrap; z-index:10;">\${nodeText}</div>
                    <img src="\${iconSrc}" style="width: 80%; height: 80%; object-fit: contain; filter: \${filterStr}; transition: filter 0.3s;" />
                \`;
                div.style.background = 'transparent';
                div.style.border = 'none';
                div.style.boxShadow = 'none';
                div.style.width = '120px';
                div.style.height = '120px';
                div.style.transform = isActive ? 'scale(1.2)' : 'scale(1)';

                nodeWrapper.appendChild(div);

                container.appendChild(nodeWrapper);
            });
            
            document.getElementById('btn-continue-node')`;
            
mapJs = mapJs.replace(oldNodesLoopRegex, newNodesLoop);
fs.writeFileSync('src/map.js', mapJs);
console.log("Rewrote map logic");
