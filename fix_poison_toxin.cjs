const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

// The width is currently 200px and scale 2.0. To make it 10% smaller, scale can be 1.8. 
code = code.replace(/animEl\.style\.cssText = \`position:absolute; top:50%; left:50%; transform:translate\(-50%, -50%\) scale\(2\.0\); width:200px; height:200px; z-index:100; pointer-events:none; filter: drop-shadow\(0 0 10px rgba\(0,0,0,0\.5\)\);\`;/, 
"animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(1.8); width:200px; height:200px; z-index:100; pointer-events:none; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));`;");

// The duration is currently 150ms. Change it to 75ms for double speed.
code = code.replace(/await new Promise\(r => setTimeout\(r, 150\)\);/g, "await new Promise(r => setTimeout(r, 75));");

fs.writeFileSync('src/combat.js', code);
