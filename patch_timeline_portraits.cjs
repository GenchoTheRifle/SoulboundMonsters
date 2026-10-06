const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

const regex = /div\.className = \`turn-icon \\\$\{isAlly \? 'ally' : 'enemy'\}\\\ \\\$\{i === 0 \? 'active' : ''\}\`;\s*div\.innerHTML = renderArt\(u\.art, 30\);/;

const replacement = `div.className = \`turn-icon \${isAlly ? 'ally' : 'enemy'} \${i === 0 ? 'active' : ''}\`;
                    const startersWithPortraits = ["Wolf", "Slime", "Sentry", "Bear", "Mushroom", "Drone", "Bat", "Treant", "Robot"];
                    if (startersWithPortraits.includes(u.name)) {
                        const portraitSide = isAlly ? 'Ally' : 'Enemy';
                        div.innerHTML = \`<img src="Art/\${u.name}_\${portraitSide}_Portrait.png" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" draggable="false" />\`;
                    } else {
                        div.innerHTML = renderArt(u.art, 30);
                    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/combat.js', code);
