const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(
    /\$\[1, 2, 3\]\.map/g, // This was missing the {} around the array in the replace.
    "$(u.isBoss ? [1,2,3,4,5] : [1,2,3]).map"
);
// Wait, the template literal has ${[1, 2, 3].map(...)}
code = code.replace(/\$\{\[1, 2, 3\]\.map/g, "${(u.isBoss ? [1,2,3,4,5] : [1,2,3]).map");
code = code.replace(/\[1, 2, 3\]\.map/g, "(u.isBoss ? [1,2,3,4,5] : [1,2,3]).map");

code = code.replace(
    /unit\.energy = Math\.min\(3, unit\.energy \+ 1\);/g,
    `const maxE = unit.isBoss ? 5 : 3;
                    const gainE = unit.isBoss ? 2 : 1;
                    unit.energy = Math.min(maxE, unit.energy + gainE);`
);

code = code.replace(
    /attacker\.energy = Math\.min\(3, attacker\.energy \+ 1\);/g,
    `attacker.energy = Math.min(attacker.isBoss ? 5 : 3, attacker.energy + 1);`
);

fs.writeFileSync('src/combat.js', code);
console.log("Patched energy!");
