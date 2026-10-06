const fs = require('fs');

let mapJs = fs.readFileSync('src/map.js', 'utf8');

mapJs = mapJs.replace(
    /let iconSrc = '';[\s\S]*?div\.style\.boxShadow = 'none';/,
    `let iconSrc = '';
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
                    <div style="position:absolute; top:-30px; left:50%; transform:translateX(-50%); color:\${isActive ? 'gold' : 'white'}; font-size:16px; font-weight:bold; text-shadow:2px 2px 2px black, 0 0 5px black; white-space:nowrap;">\${nodeText}</div>
                    <img src="\${iconSrc}" style="width: 100%; height: 100%; object-fit: contain; filter: \${filterStr}; transition: filter 0.3s;" />
                \`;
                div.style.background = 'transparent';
                div.style.border = 'none';
                div.style.boxShadow = 'none';`
);

mapJs = mapJs.replace(
    /div\.style\.transform = \`translateY\(\$\{offsets\[i\]\}px\)\`;/,
    `div.style.transform = \`translateY(\${offsets[i]}px) \${isActive ? 'scale(1.2)' : 'scale(1)'}\`;`
);

fs.writeFileSync('src/map.js', mapJs);
console.log("Patched node icons v2!");
