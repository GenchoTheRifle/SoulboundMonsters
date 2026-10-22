const fs = require('fs');

// Patch CSS
let css = fs.readFileSync('src/styles.css', 'utf8');
css += `
@keyframes slideLeft {
    0% { transform: translateX(0); }
    100% { transform: translateX(-60px); }
}

@keyframes fadeOutLeft {
    0% { opacity: 1; transform: scale(1) translateY(0); }
    100% { opacity: 0; transform: scale(0) translateY(-20px); }
}

.timeline-arrow {
    position: absolute;
    top: -20px;
    left: 20px;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 15px solid gold;
    filter: drop-shadow(0px 0px 2px black);
    z-index: 10;
    animation: bounce 1s infinite;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(5px); }
}
`;
fs.writeFileSync('src/styles.css', css);

// Patch updateCombatUI
let js = fs.readFileSync('src/combat.js', 'utf8');

// The turn order rendering:
const turnOrderUIRegex = /const turnOrderEl = document\.getElementById\('turn-order'\);\s*turnOrderEl\.innerHTML = '';\s*currentRun\.turnOrder\.forEach\(\(u, i\) => \{[\s\S]*?turnOrderEl\.appendChild\(div\);\s*\}\);/;

const newTurnOrderUI = `const turnOrderEl = document.getElementById('turn-order');
            turnOrderEl.innerHTML = '';
            
            // Render arrow pointing at first icon
            const arrow = document.createElement('div');
            arrow.className = 'timeline-arrow';
            turnOrderEl.appendChild(arrow);
            
            if (currentRun.timeline) {
                currentRun.timeline.forEach((u, i) => {
                    if (u.currentHp <= 0 && i !== 0) return; // Keep active unit even if dead during their turn
                    const div = document.createElement('div');
                    const isAlly = !u.isEnemy;
                    div.className = \`turn-icon \${isAlly ? 'ally' : 'enemy'} \${i === 0 ? 'active' : ''}\`;
                    div.innerHTML = renderArt(u.art, 30);
                    div.title = u.name;
                    div.style.position = 'relative';
                    turnOrderEl.appendChild(div);
                });
            }`;

js = js.replace(turnOrderUIRegex, newTurnOrderUI);
fs.writeFileSync('src/combat.js', js);

