const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

const target = "div.className = `turn-icon ${isAlly ? 'ally' : 'enemy'} ${i === 0 ? 'active' : ''}`;\n                    div.innerHTML = renderArt(u.art, 30);";

const replacement = "div.className = `turn-icon ${isAlly ? 'ally' : 'enemy'} ${i === 0 ? 'active' : ''}`;\n                    const startersWithPortraits = ['Wolf', 'Slime', 'Sentry', 'Bear', 'Mushroom', 'Drone', 'Bat', 'Treant', 'Robot'];\n                    if (startersWithPortraits.includes(u.name)) {\n                        const portraitSide = isAlly ? 'Ally' : 'Enemy';\n                        div.innerHTML = `<img src=\"Art/${u.name}_${portraitSide}_Portrait.png\" style=\"width: 100%; height: 100%; object-fit: cover; border-radius: 50%;\" draggable=\"false\" />`;\n                    } else {\n                        div.innerHTML = renderArt(u.art, 30);\n                    }";

code = code.replace(target, replacement);
fs.writeFileSync('src/combat.js', code);
