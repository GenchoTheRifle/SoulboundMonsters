const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

const nextTurnRegex = /const unit = currentRun\.turnOrder\[currentRun\.activeTurnIndex\];/;
const newNextTurn = `if (!combatState.activeUnit) {
                combatState.activeUnit = pullNextUnit();
                calculateTimeline(combatState.activeUnit);
            }
            const unit = combatState.activeUnit;`;
code = code.replace(nextTurnRegex, newNextTurn);

const advanceTurnRegex = /const unit = currentRun\.turnOrder\[currentRun\.activeTurnIndex\];[\s\S]*?currentRun\.activeTurnIndex = \(currentRun\.activeTurnIndex \+ 1\) % currentRun\.turnOrder\.length;[\s\S]*?nextTurn\(\);/;

const newAdvanceTurn = `const unit = combatState.activeUnit;
            if (unit && unit.currentHp > 0) {
                if (unit.skipEnergyGeneration) {
                    unit.skipEnergyGeneration = false;
                } else {
                    unit.energy = Math.min(3, unit.energy + 1);
                }
                
                if (unit.buffs) {
                    unit.buffs.forEach(b => {
                        if (b.isNew) b.isNew = false;
                        else if (b.type !== 'guard' && b.type !== 'guard_pct') b.turns--;
                    });
                    unit.buffs = unit.buffs.filter(b => b.turns > 0 || b.type === 'guard' || b.type === 'guard_pct');
                }
                if (unit.debuffs) {
                    unit.debuffs.forEach(d => {
                        if (d.isNew) d.isNew = false;
                        else d.turns--;
                    });
                    unit.debuffs = unit.debuffs.filter(d => d.turns > 0);
                }
            }

            const turnOrderEl = document.getElementById('turn-order');
            if (turnOrderEl && turnOrderEl.children.length > 0) {
                const firstIcon = turnOrderEl.children[0];
                firstIcon.style.animation = 'fadeOutLeft 0.5s forwards';
                
                const icons = Array.from(turnOrderEl.children).slice(1);
                icons.forEach(icon => {
                    icon.style.animation = 'slideLeft 0.5s forwards';
                });

                setTimeout(() => {
                    combatState.activeUnit = null;
                    nextTurn();
                }, 500);
            } else {
                combatState.activeUnit = null;
                nextTurn();
            }`;
code = code.replace(advanceTurnRegex, newAdvanceTurn);

fs.writeFileSync('src/combat.js', code);
