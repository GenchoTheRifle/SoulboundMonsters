const fs = require('fs');

let mapJs = fs.readFileSync('src/map.js', 'utf8');

mapJs = mapJs.replace(
    /\/\/ Generate vertical offsets[\s\S]*?nodeWrapper\.appendChild\(div\);/m,
    `const MAP_NODE_POSITIONS = [
                { x: 0.11797, y: 0.46103 },
                { x: 0.18151, y: 0.49195 },
                { x: 0.25268, y: 0.50228 },
                { x: 0.33464, y: 0.47648 },
                { x: 0.39817, y: 0.34248 },
                { x: 0.47318, y: 0.35788 },
                { x: 0.56484, y: 0.46230 },
                { x: 0.66173, y: 0.51641 },
                { x: 0.74505, y: 0.45457 },
                { x: 0.91067, y: 0.46233 }
            ];

            currentRun.nodes.forEach((n, i) => {
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
                    iconSrc = 'Art/Hands.png'; // placeholder for merge
                    nodeText = 'Merge';
                }
                
                const isActive = i === currentRun.nodeIndex;
                const filterStr = isActive ? 'drop-shadow(0 0 15px gold) drop-shadow(0 0 5px rgba(0,0,0,0.8))' : 'drop-shadow(0 0 5px rgba(0,0,0,0.8))';
                
                div.innerHTML = \`
                    <div style="position:absolute; top:-30px; left:50%; transform:translateX(-50%); color:\${isActive ? 'gold' : 'white'}; font-size:16px; font-weight:bold; text-shadow:2px 2px 2px black, 0 0 5px black; white-space:nowrap; z-index:10;">\${nodeText}</div>
                    <img src="\${iconSrc}" style="width: 100%; height: 100%; object-fit: contain; filter: \${filterStr}; transition: filter 0.3s;" />
                \`;
                div.style.background = 'transparent';
                div.style.border = 'none';
                div.style.boxShadow = 'none';
                div.style.transform = isActive ? 'scale(1.2)' : 'scale(1)';
                
                nodeWrapper.appendChild(div);`
);

fs.writeFileSync('src/map.js', mapJs);
console.log("Patched node placement logic!");
