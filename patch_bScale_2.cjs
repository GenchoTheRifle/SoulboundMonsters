const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(/const bScale = t\.isBoss \? 'scale\(2\.0, 2\.0\)' : 'scale\(1\.0, 1\.0\)';/g, "const bScale = 'scale(1.0, 1.0)';");

fs.writeFileSync('src/combat.js', code);
console.log("Patched bScale string in combat.js");
