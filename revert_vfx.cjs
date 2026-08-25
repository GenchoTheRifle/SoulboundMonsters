const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(/await new Promise\(r => setTimeout\(r, 250\)\);/g, "await new Promise(r => setTimeout(r, 75));");

fs.writeFileSync('src/combat.js', code);
