const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(/                        if \(move\.n === "Giant Spore" \|\| move\.n === "Slumber Sludge"\) \{[\s\S]*?\}[\s\S]*?\} else if \(eff.type.includes\('poison'\)\)/, 
`} else if (eff.type.includes('poison'))`);

fs.writeFileSync('src/combat.js', code);
