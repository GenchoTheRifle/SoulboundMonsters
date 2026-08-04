const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(/            let shadowClass = "shadow-small";[\s\S]*?if \(bigShadows.includes\(u\.name\)\) \{[\s\S]*?\} else if \(mediumShadows.includes\(u\.name\)\) \{[\s\S]*?\}/, 'let shadowClass = getShadowClass(u.name);');

fs.writeFileSync('src/combat.js', code);
