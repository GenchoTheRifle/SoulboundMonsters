const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(/async function playStatusVFX\(unit, type\) \{[\s\S]*?if \(animEl\.parentNode === targetEl\) \{\s*targetEl\.removeChild\(animEl\);\s*\}\s*\}/g,
`async function playStatusVFX(unit, type, onImpact) {
            const targetEl = getElementForUnit(unit);
            if (!targetEl) {
                if (onImpact) onImpact();
                return;
            }
            
            const animEl = document.createElement('img');
            animEl.src = \`Art/\${type}_1.png\`;
            animEl.style.cssText = \`position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(2.0); width:200px; height:200px; z-index:100; pointer-events:none; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));\`;
            targetEl.appendChild(animEl);
            
            for (let i = 1; i <= 7; i++) {
                animEl.src = \`Art/\${type}_\${i}.png\`;
                if (i === 5 && onImpact) {
                    onImpact();
                }
                await new Promise(r => setTimeout(r, 60));
            }
            
            if (animEl.parentNode === targetEl) {
                targetEl.removeChild(animEl);
            }
        }`);

fs.writeFileSync('src/combat.js', code);
