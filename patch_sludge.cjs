const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(/if \(move\.n\.includes\("Spit"\)\) \{/g, 
`if (move.n.includes("Spit") || move.n.includes("Slumber Sludge")) {
                    const animPrefix = move.n.includes("Slumber Sludge") ? "SlumberSludge" : "Spit";`);

code = code.replace(/spitAnimEl\.src = "Art\/Spit_1\.png";/g, 
`spitAnimEl.src = \`Art/\${animPrefix}_1.png\`;`);

code = code.replace(/spitAnimEl\.src = "Art\/Spit_2\.png";/g, 
`spitAnimEl.src = \`Art/\${animPrefix}_2.png\`;`);

fs.writeFileSync('src/combat.js', code);
