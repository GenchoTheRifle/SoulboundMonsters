const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(/const bScale = t\.isBoss \? 2\.0 : 1\.0;/g, "const bScale = 1.0;");
code = code.replace(/const bScale = t\.isBoss \? 'scale\\(2\.0, 2\.0\\)' : 'scale\\(1\.0, 1\.0\\)';/g, "const bScale = 'scale(1.0, 1.0)';");
code = code.replace(/const baseScale = t\.isBoss \? 2\.0 : 1\.0;/g, "const baseScale = 1.0;");

fs.writeFileSync('src/combat.js', code);
console.log("Patched bScale in combat.js");
