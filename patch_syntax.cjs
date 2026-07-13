const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');
code = code.replace(/sporeEl\.style\.cssText = \`position:absolute;([\s\S]*?)\\\`;/g, 'sporeEl.style.cssText = \`position:absolute;$1\`;');
fs.writeFileSync('src/combat.js', code);
