const fs = require('fs');

let mapJs = fs.readFileSync('src/map.js', 'utf8');

mapJs = mapJs.replace(
    /div\.innerText = n\.type === 'boss' \? 'BOSS' : \(n\.type === 'combat' \? 'Battle' : 'Merge'\);/,
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
                
                div.innerHTML = \`
                    <div style="position:absolute; top:-30px; left:50%; transform:translateX(-50%); color:white; font-size:16px; font-weight:bold; text-shadow:2px 2px 2px black, 0 0 5px black; white-space:nowrap;">\${nodeText}</div>
                    <img src="\${iconSrc}" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 5px rgba(0,0,0,0.8));" />
                \`;
                div.style.background = 'transparent';
                div.style.border = 'none';
                div.style.boxShadow = 'none';`
);

fs.writeFileSync('src/map.js', mapJs);
console.log("Patched node icons!");
