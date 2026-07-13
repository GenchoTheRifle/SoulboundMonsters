const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(/\\\`Art\/\$\{type\}_1\.png\\\`;/g, "\`Art/\${type}_1.png\`;");
code = code.replace(/\\\`position:absolute; top:50%; left:50%; transform:translate\(-50%, -50%\) scale\(2\.0\); width:200px; height:200px; z-index:100; pointer-events:none; filter: drop-shadow\(0 0 10px rgba\(0,0,0,0\.5\)\);\\\`;/g, "\`position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(2.0); width:200px; height:200px; z-index:100; pointer-events:none; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));\`;");
code = code.replace(/\\\`Art\/\$\{type\}_\$\{i\}\.png\\\`;/g, "\`Art/\${type}_\${i}.png\`;");

fs.writeFileSync('src/combat.js', code);
