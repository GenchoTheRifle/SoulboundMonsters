const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

const poisonReplacement = `if (unit.currentHp <= 0) {
                        isDead = true;
                        combatLog(\`\${unit.name} fainted from poison!\`);
                        if (unit.isEnemy && !combatState.firstKilledEnemy) {
                            combatState.firstKilledEnemy = unit;
                        }
                        calculateTurnOrder(true);
                    }`;

code = code.replace(/if \(unit\.currentHp <= 0\) \{\s*isDead = true;\s*combatLog\(\`\$\{unit\.name\} fainted from poison!\`\);\s*calculateTurnOrder\(true\);\s*\}/g, poisonReplacement);

const toxinReplacement = `if (unit.currentHp <= 0) {
                        isDead = true;
                        combatLog(\`\${unit.name} fainted from toxin!\`);
                        if (unit.isEnemy && !combatState.firstKilledEnemy) {
                            combatState.firstKilledEnemy = unit;
                        }
                        calculateTurnOrder(true);
                    }`;

code = code.replace(/if \(unit\.currentHp <= 0\) \{\s*isDead = true;\s*combatLog\(\`\$\{unit\.name\} fainted from toxin!\`\);\s*calculateTurnOrder\(true\);\s*\}/g, toxinReplacement);

fs.writeFileSync('src/combat.js', code);
