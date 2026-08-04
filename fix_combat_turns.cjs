const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

// The corrupted nextTurn started at around line 692. It went all the way up to `function renderMoveControls` (around line 750).
// I will just use regex to replace everything from `async function nextTurn()` to `function renderMoveControls`.
const turnRegex = /async function nextTurn\(\) \{[\s\S]*?function renderMoveControls\(unit\)/;
const replacement = `async function nextTurn() {
            // Check win/loss
            if (combatState.enemies.every(e => !e || e.currentHp <= 0)) {
                combatLog("Victory!");
                setTimeout(endCombat, 1500, true);
                return;
            }
            if (currentRun.party.every(p => !p || p.currentHp <= 0)) {
                combatLog("Defeat...");
                setTimeout(() => endCombat(false), 2000);
                return;
            }

            if (!combatState.activeUnit) {
                combatState.activeUnit = pullNextUnit();
                calculateTimeline(combatState.activeUnit);
            }
            const unit = combatState.activeUnit;

            if (!unit || unit.currentHp <= 0) {
                advanceTurn();
                return;
            }

            // Recalculate mods
            unit.atkMod = 0;
            unit.spdMod = 0;
            unit.defMod = 0;

            if (unit.buffs) {
                unit.buffs.forEach(b => {
                    if (b.type === 'atk_buff' || b.type === 'atk_buff_pct') unit.atkMod += b.value;
                    if (b.type === 'spd_buff' || b.type === 'spd_buff_pct') unit.spdMod += b.value;
                    if (b.type === 'guard' || b.type === 'guard_pct') unit.defMod = b.value;
                    if (b.type === 'regen' || b.type === 'regen_flat' || b.type === 'regen_pct') {
                        const healAmount = b.type === 'regen_pct' ? Math.floor(unit.hp * b.value) : b.value;
                        unit.currentHp = Math.min(unit.hp, unit.currentHp + healAmount);
                        showFloatingText(unit, "+" + healAmount, "#51cf66");
                        playHealVFX(unit);
                        combatLog(\`\${unit.name} regenerated \${healAmount} HP!\`);
                    }
                });
            }
            // Apply debuffs
            if (unit.debuffs) {
                unit.debuffs.forEach(d => {
                    if (d.type === 'atk_debuff' || d.type === 'atk_debuff_pct') unit.atkMod -= d.value;
                    if (d.type === 'spd_debuff' || d.type === 'spd_debuff_pct') unit.spdMod -= d.value;
                });
            }

            // Poison
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
                        if (unit.isEnemy && !combatState.firstKilledEnemy) {
                            combatState.firstKilledEnemy = unit;
                        }
                        calculateTurnOrder(true);
                    }
                });

                if (isDead) {
                    setTimeout(nextTurn, 1000);
                    return;
                }
            }

            // Toxin
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
                        if (unit.isEnemy && !combatState.firstKilledEnemy) {
                            combatState.firstKilledEnemy = unit;
                        }
                        calculateTurnOrder(true);
                    }
                });

                if (isDead) {
                    setTimeout(nextTurn, 1000);
                    return;
                }
            }

            if (unit.stunned > 0) {
                combatLog(\`\${unit.name} is stunned and skips their turn!\`);
                unit.stunned--;
                unit.skipEnergyGeneration = true;
                setTimeout(advanceTurn, 1000);
                return;
            }

            if (unit.sleep > 0) {
                combatLog(\`\${unit.name} is asleep and skips their turn!\`);
                unit.sleep--;
                setTimeout(advanceTurn, 1000);
                return;
            }

            combatState.activeUnit = unit;
            combatState.isPlayerTurn = !unit.isEnemy;
            updateCombatUI();

            if (combatState.isPlayerTurn) {
                renderMoveControls(unit);
            } else {
                document.getElementById('move-controls').innerHTML = '';
                await new Promise(r => setTimeout(r, 1000));
                enemyAI(unit);
            }
        }

        function advanceTurn() {
            if (combatState.ended) return;
            combatState.targetingMove = null;
            combatState.isPlayerTurn = false;
            updateCombatUI();
            
            const unit = combatState.activeUnit;
            if (unit && unit.currentHp > 0) {
                if (unit.skipEnergyGeneration) {
                    unit.skipEnergyGeneration = false;
                } else {
                    unit.energy = Math.min(3, unit.energy + 1);
                }
                
                // Decay buffs and debuffs at turn end
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
                const arrow = turnOrderEl.querySelector('.timeline-arrow');
                const icons = Array.from(turnOrderEl.querySelectorAll('.turn-icon'));
                if (icons.length > 0) {
                    icons[0].style.animation = 'fadeOutLeft 0.5s forwards';
                }
                
                const slideIcons = icons.slice(1);
                slideIcons.forEach(icon => {
                    icon.style.animation = 'slideLeft 0.5s forwards';
                });

                setTimeout(() => {
                    combatState.activeUnit = null;
                    nextTurn();
                }, 500);
            } else {
                combatState.activeUnit = null;
                nextTurn();
            }
        }

        function renderMoveControls(unit)`;

code = code.replace(turnRegex, replacement);

fs.writeFileSync('src/combat.js', code);
