const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(/combatState\.targetingMove = null;/, `combatState.targetingMove = null;\n            combatState.activeUnit = null;\n            combatState.ended = false;`);

fs.writeFileSync('src/combat.js', code);
