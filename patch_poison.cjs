const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

code = code.replace(/\/\/ Poison\s+if \(unit\.poison > 0 && unit\.poisonTurns > 0\) \{[\s\S]*?if \(unit\.currentHp <= 0\) \{[\s\S]*?\}\s*\}/, 
`// Poison
            if (unit.poison > 0 && unit.poisonTurns > 0) {
                let isDead = false;
                await playStatusVFX(unit, 'Poison', () => {
                    const dmg = unit.poison;
                    unit.currentHp -= dmg;
                    showFloatingText(unit, "-" + dmg, "#a200ff");
                    unit.poisonTurns--;
                    if (unit.poisonTurns <= 0) unit.poison = 0;
                    
                    combatLog(\`\${unit.name} took \${dmg} poison damage!\`);
                    
                    if (unit.currentHp <= 0) {
                        isDead = true;
                        combatLog(\`\${unit.name} fainted from poison!\`);
                        calculateTurnOrder(true);
                    }
                });

                if (isDead) {
                    setTimeout(nextTurn, 1000);
                    return;
                }
            }`);

code = code.replace(/\/\/ Toxin\s+if \(unit\.toxin > 0 && unit\.toxinTurns > 0\) \{[\s\S]*?if \(unit\.currentHp <= 0\) \{[\s\S]*?\}\s*\}/, 
`// Toxin
            if (unit.toxin > 0 && unit.toxinTurns > 0) {
                let isDead = false;
                await playStatusVFX(unit, 'Toxin', () => {
                    const dmg = unit.toxin;
                    unit.currentHp -= dmg;
                    showFloatingText(unit, "-" + dmg, "#a200ff");
                    unit.toxinTurns--;
                    if (unit.toxinTurns <= 0) unit.toxin = 0;
                    
                    combatLog(\`\${unit.name} took \${dmg} toxin damage!\`);
                    
                    if (unit.currentHp <= 0) {
                        isDead = true;
                        combatLog(\`\${unit.name} fainted from toxin!\`);
                        calculateTurnOrder(true);
                    }
                });

                if (isDead) {
                    setTimeout(nextTurn, 1000);
                    return;
                }
            }`);

fs.writeFileSync('src/combat.js', code);
