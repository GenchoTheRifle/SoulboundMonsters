const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

// Fix playStatusVFX
code = code.replace(/async function playStatusVFX[\s\S]*?if \(animEl\.parentNode === targetEl\) \{\s*targetEl\.removeChild\(animEl\);\s*\}\s*\}/, 
`async function playStatusVFX(unit, type, onImpact) {
            const targetEl = getElementForUnit(unit);
            if (!targetEl) {
                if (onImpact) onImpact();
                return;
            }
            
            const animEl = document.createElement('img');
            animEl.src = \\\`Art/\${type}_1.png\\\`;
            animEl.style.cssText = \\\`position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(2.0); width:200px; height:200px; z-index:100; pointer-events:none; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));\\\`;
            const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
            artContainer.appendChild(animEl);
            
            // Preload images to avoid flickering
            for (let i = 2; i <= 7; i++) {
                const img = new Image();
                img.src = \\\`Art/\${type}_\${i}.png\\\`;
            }
            
            for (let i = 1; i <= 7; i++) {
                animEl.src = \\\`Art/\${type}_\${i}.png\\\`;
                if (i === 5 && onImpact) {
                    onImpact();
                }
                await new Promise(r => setTimeout(r, 150));
            }
            
            if (animEl.parentNode) {
                animEl.parentNode.removeChild(animEl);
            }
        }`);

// Fix Spore mushroom scale and z-index
code = code.replace(/mushroomEl\.style\.cssText = "position:absolute; bottom:-10px; left:50%; transform:translateX\(-50%\) scale\(0\); width:250px; height:auto; z-index:5; pointer-events:none; transform-origin: bottom center;";/,
`mushroomEl.style.cssText = "position:absolute; bottom:-10px; left:50%; transform:translateX(-50%) scale(0); width:225px; height:auto; z-index:5; pointer-events:none; transform-origin: bottom center;";`);

code = code.replace(/mushroomEl\.animate\(\[\s*\{ transform: 'translateX\(-50%\) scale\(0\)' \},\s*\{ transform: 'translateX\(-50%\) scale\(1\.1\)' \},\s*\{ transform: 'translateX\(-50%\) scale\(1\)' \}\s*\], \{ duration: 250, easing: 'ease-out', fill: 'forwards' \}\);/g,
`mushroomEl.animate([
                                { transform: 'translateX(-50%) scale(0)' },
                                { transform: 'translateX(-50%) scale(0.99)' },
                                { transform: 'translateX(-50%) scale(0.9)' }
                            ], { duration: 250, easing: 'ease-out', fill: 'forwards' });`);

code = code.replace(/mushroomEl\.animate\(\[\s*\{ transform: 'translateX\(-50%\) scale\(1, 1\)' \},\s*\{ transform: 'translateX\(-50%\) scale\(1\.3, 0\.7\)' \},\s*\{ transform: 'translateX\(-50%\) scale\(0\.8, 1\.3\)' \},\s*\{ transform: 'translateX\(-50%\) scale\(1, 1\)' \}\s*\], \{ duration: 300, easing: 'ease-in-out' \}\);/g,
`mushroomEl.animate([
                                { transform: 'translateX(-50%) scale(0.9, 0.9)' },
                                { transform: 'translateX(-50%) scale(1.17, 0.63)' },
                                { transform: 'translateX(-50%) scale(0.72, 1.17)' },
                                { transform: 'translateX(-50%) scale(0.9, 0.9)' }
                            ], { duration: 300, easing: 'ease-in-out' });`);

// Update stats-container z-index to stay above mushrooms
code = code.replace(/<div class="stats-container" style="position: relative; padding-top: 10px;">/g, 
`<div class="stats-container" style="position: relative; padding-top: 10px; z-index: 10;">`);

fs.writeFileSync('src/combat.js', code);
