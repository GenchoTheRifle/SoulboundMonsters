const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');
code = code.replace(/mushroomEl\.style\.cssText = "position:absolute; bottom:-40px; left:50%; transform:translateX\(-50%\) scale\(0\); width:250px; height:auto; z-index:100; pointer-events:none; transform-origin: bottom center;";\s+targetEl\.appendChild\(mushroomEl\);/g, 
`mushroomEl.style.cssText = "position:absolute; bottom:-10px; left:50%; transform:translateX(-50%) scale(0); width:250px; height:auto; z-index:5; pointer-events:none; transform-origin: bottom center;";
                        const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                        artContainer.appendChild(mushroomEl);`);

code = code.replace(/sporeEl\.style\.cssText = \`position:absolute; bottom:-10px; left:50%; transform:translate\(calc\(-50% \+ \$\{startX\}px\), \$\{startY\}px\) scale\(0\.5\); width:40px; height:40px; z-index:101; pointer-events:none; opacity:1; filter: drop-shadow\(0 0 5px #51cf66\);\`;\s+targetEl\.appendChild\(sporeEl\);/g,
`sporeEl.style.cssText = \\\`position:absolute; bottom:-10px; left:50%; transform:translate(calc(-50% + \${startX}px), \${startY}px) scale(0.5); width:40px; height:40px; z-index:101; pointer-events:none; opacity:1; filter: drop-shadow(0 0 5px #51cf66);\\\`;
                                const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                                artContainer.appendChild(sporeEl);`);
                                
code = code.replace(/if \(targetEl && sporeEl\.parentNode === targetEl\) targetEl\.removeChild\(sporeEl\);/g, 
`if (sporeEl.parentNode) sporeEl.parentNode.removeChild(sporeEl);`);

code = code.replace(/if \(targetEl && mushroomEl\.parentNode === targetEl\) targetEl\.removeChild\(mushroomEl\);/g,
`if (mushroomEl.parentNode) mushroomEl.parentNode.removeChild(mushroomEl);`);

fs.writeFileSync('src/combat.js', code);
