// --- COMBAT ENGINE ---
        let combatState = {
            enemies: [],
            log: [],
            isPlayerTurn: false,
            activeUnit: null,
            targetingMove: null,
            firstKilledEnemy: null,
            turnJustStarted: true,
            ended: false
        };

        function initCombat(node) {
            showScreen('screen-combat');
            combatState.log = ["Combat Started!"];
            combatState.targetingMove = null;
            combatState.firstKilledEnemy = null;
            combatState.turnJustStarted = true;
            combatState.ended = false;
            
            // Generate Enemies
            let enemyCount = node.type === 'boss' ? 1 : Math.min(3, node.level + 1);
            if (currentRun.nodeIndex < 2) enemyCount = 1; // Node 1 & 2 only 1 enemy
            if (currentRun.nodeIndex === 3) enemyCount = 2; // Node 4: 2 enemies
            if (currentRun.nodeIndex === 4) enemyCount = 2; // Node 5: 2 enemies

            combatState.enemies = [];
            
            // Define pools
            const simplePool = ['wolf', 'slime', 'sentry'];
            const advancedPool = ['bear', 'mushroom', 'sparkbot'];
            const allPool = [...simplePool, ...advancedPool];

            let pool = allPool;
            if (currentRun.nodeIndex <= 3) pool = simplePool; // Nodes 1, 2, 4
            else if (currentRun.nodeIndex === 4) pool = advancedPool; // Node 5

            if (node.type === 'boss') {
                const base = BOSSES['boss'];
                const enemyHp = base.hp;
                const enemyAtk = base.atk;
                combatState.enemies.push({
                    ...base,
                    baseId: base.id,
                    hp: enemyHp,
                    currentHp: enemyHp,
                    atk: enemyAtk,
                    isEnemy: true,
                    isBoss: true,
                    id: `enemy-${Date.now()}-boss`,
                    energy: base.startingEnergy !== undefined ? base.startingEnergy : 1,
                    atkMod: 0,
                    spdMod: 0,
                    defMod: 1.0,
                    buffs: [],
                    stunned: false,
                    poison: 0
                });
            } else {
                for (let i = 0; i < enemyCount; i++) {
                    const key = pool[Math.floor(Math.random() * pool.length)];
                    const base = STARTERS[key];
                    
                    // Base multiplier for node level
                    const levelMult = 0.8 + (node.level * 0.2);
                    
                    // User wants enemies to be 20% WEAKER than player monsters.
                    // We'll use the base stats * levelMult * 0.8 to ensure they are always 20% weaker than a "standard" version of themselves at that level.
                    const enemyHp = Math.floor(base.hp * levelMult * 0.8);
                    const enemyAtk = Math.floor(base.atk * levelMult * 0.8);

                    combatState.enemies.push({
                        ...base,
                        baseId: base.id, // Keep track of base ID for recruitment
                        hp: enemyHp,
                        currentHp: enemyHp,
                        atk: enemyAtk,
                        isEnemy: true,
                        id: `enemy-${Date.now()}-${i}`,
                        energy: base.startingEnergy !== undefined ? base.startingEnergy : 1,
                        atkMod: 0,
                        spdMod: 0,
                        defMod: 1.0,
                        buffs: [],
                        stunned: false,
                        poison: 0
                    });
                }
            }

            // Reset player energy and mods
            currentRun.party.forEach(p => {
                if (!p) return;
                p.energy = p.startingEnergy !== undefined ? p.startingEnergy : 1;
                p.atkMod = 0;
                p.spdMod = 0;
                p.defMod = 1.0;
                p.buffs = [];
                p.stunned = false;
                p.poison = 0;
            });

            // Pad enemies to 4 slots if not boss
            if (node.type !== 'boss') {
                while (combatState.enemies.length < 4) {
                    combatState.enemies.push(null);
                }
            }

            calculateTurnOrder();
            updateCombatUI();
            nextTurn();
        }
        function calculateTurnOrder() {
            const all = [...currentRun.party, ...combatState.enemies].filter(u => u && u.currentHp > 0);
            all.sort((a, b) => b.spd - a.spd);
            currentRun.turnOrder = all;
            currentRun.activeTurnIndex = 0;
        }

        function updateCombatUI() {
            const unit = currentRun.turnOrder[currentRun.activeTurnIndex];
            if (!unit) return;

            const enemyTeam = document.getElementById('enemy-team');
            const playerTeam = document.getElementById('player-team');
            enemyTeam.innerHTML = '';
            playerTeam.innerHTML = '';

            if (combatState.enemies.some(e => e && e.isBoss)) {
                enemyTeam.classList.add('boss-team');
            } else {
                enemyTeam.classList.remove('boss-team');
            }

            combatState.enemies.forEach((e, index) => {
                if (e) {
                    const el = createCombatantEl(e);
                    enemyTeam.appendChild(el);
                } else {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.className = 'combatant empty';
                    enemyTeam.appendChild(emptyDiv);
                }
            });
            currentRun.party.forEach((p, index) => {
                if (p) {
                    const el = createCombatantEl(p);
                    playerTeam.appendChild(el);
                } else {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.className = 'combatant empty';
                    playerTeam.appendChild(emptyDiv);
                }
            });

            const turnOrderEl = document.getElementById('turn-order');
            turnOrderEl.innerHTML = '';
            currentRun.turnOrder.forEach((u, i) => {
                if (u.currentHp <= 0) return;
                const div = document.createElement('div');
                const isAlly = !u.isEnemy;
                div.className = `turn-icon ${isAlly ? 'ally' : 'enemy'} ${i === currentRun.activeTurnIndex ? 'active' : ''}`;
                div.innerHTML = renderArt(u.art, 30);
                div.title = u.name;
                turnOrderEl.appendChild(div);
            });

            const energy = unit.energy;
            document.getElementById('energy-display').innerText = `EN: ${energy}`;
            document.getElementById('combat-log').innerHTML = combatState.log.slice(-5).join('<br>');
            
            const infoEl = document.getElementById('active-unit-info');
            if (combatState.activeUnit && !combatState.activeUnit.isEnemy) {
                const types = (Array.isArray(combatState.activeUnit.type) ? combatState.activeUnit.type : [combatState.activeUnit.type]).filter(Boolean);
                const typeIcons = types.map(t => getElementIcon(t) ? `<img src="${getElementIcon(t)}" style="width:24px; height:24px; vertical-align:middle;" alt="${t}" />` : t).join('');
                infoEl.innerHTML = `<span style="vertical-align:middle;">${combatState.activeUnit.name}</span> <span style="display:inline-flex; gap:2px; vertical-align:middle;">${typeIcons}</span>`;
            } else {
                infoEl.innerHTML = '';
            }

            const endTurnBtn = document.getElementById('btn-end-turn');
            if (endTurnBtn) {
                const canEndTurn = combatState.isPlayerTurn && !combatState.ended;
                endTurnBtn.disabled = !canEndTurn;
                endTurnBtn.style.display = canEndTurn ? 'block' : 'none';
            }
        }

        function createCombatantEl(u) {
            const div = document.createElement('div');
            
            let isTargetable = false;
            if (combatState.targetingMove && u.currentHp > 0) {
                const targetType = combatState.targetingMove.effect?.target || "enemy";
                if (targetType === "ally") {
                    isTargetable = !u.isEnemy;
                } else {
                    isTargetable = u.isEnemy;
                }
            }

            div.className = `combatant ${u.currentHp <= 0 ? 'dead' : ''} ${isTargetable ? 'targetable' : ''} ${u.isEnemy ? 'enemy' : 'ally'} ${u.isBoss ? 'boss' : ''}`;
            const hpPerc = Math.max(0, (u.currentHp / u.hp) * 100);
            let hpColor = '#ff6b6b';
            if (hpPerc > 66) hpColor = '#51cf66';
            else if (hpPerc > 33) hpColor = '#fcc419';

            const types = (Array.isArray(u.type) ? u.type : [u.type]).filter(Boolean);
            
            let artHtml = '';
            if (u.art.includes('.png') || u.art.includes('/')) {
                artHtml = `<img src="${u.art}" alt="${u.name}" />`;
            } else {
                artHtml = `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${u.art}</div>`;
            }

            let statusHtml = '';
            if (u.currentHp > 0) {
                if (u.poison > 0) statusHtml += `<div style="color: #9c27b0; font-weight: bold; text-shadow: 1px 1px 2px black; margin-bottom: 2px;">Poisoned</div>`;
                if (u.sleep > 0) statusHtml += `<div style="color: #00bcd4; font-weight: bold; text-shadow: 1px 1px 2px black; margin-bottom: 2px;">Sleeping</div>`;
                if (u.stunned > 0) statusHtml += `<div style="color: #ffeb3b; font-weight: bold; text-shadow: 1px 1px 2px black; margin-bottom: 2px;">Stunned</div>`;
                if (u.buffs && u.buffs.some(b => b.type === 'regen')) statusHtml += `<div style="color: #4caf50; font-weight: bold; text-shadow: 1px 1px 2px black; margin-bottom: 2px;">Regen</div>`;
                if (u.defMod < 1.0) statusHtml += `<div style="color: #2196f3; font-weight: bold; text-shadow: 1px 1px 2px black; margin-bottom: 2px;">Guarded</div>`;
                if (u.atkMod > 0) statusHtml += `<div style="color: #f44336; font-weight: bold; text-shadow: 1px 1px 2px black; margin-bottom: 2px;">ATK Up</div>`;
                if (u.atkMod < 0) statusHtml += `<div style="color: #795548; font-weight: bold; text-shadow: 1px 1px 2px black; margin-bottom: 2px;">ATK Down</div>`;
                if (u.spdMod > 0) statusHtml += `<div style="color: #ff9800; font-weight: bold; text-shadow: 1px 1px 2px black; margin-bottom: 2px;">SPD Up</div>`;
            }

            div.innerHTML = `
                <div style="position: absolute; top: -40px; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 10;">
                    ${statusHtml}
                </div>
                <div class="monster-art-container">
                    ${artHtml}
                    <div class="shadow-ellipse"></div>
                </div>
                <div class="stats-container">
                    <div class="name" style="display:flex; align-items:center; justify-content:center; gap:5px;">
                        ${u.name}
                        <div class="type-container" style="display:flex; gap:2px;">
                            ${types.map(t => {
                                const icon = getElementIcon(t);
                                return icon ? `<img src="${icon}" style="width:24px; height:24px;" alt="${t}" />` : `<div class="type-tag type-${t.toLowerCase()}" style="font-size:8px; padding:2px 4px;">${t}</div>`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="hp-bar"><div class="hp-fill" style="width:${hpPerc}%; background-color:${hpColor};"></div></div>
                </div>
            `;
            if (u === combatState.activeUnit) div.classList.add('active-turn');
            
            if (isTargetable) {
                div.onclick = () => executeMove(combatState.activeUnit, combatState.targetingMove, u);
            }
            return div;
        }

        async function nextTurn() {
            // Check win/loss
            if (combatState.enemies.every(e => !e || e.currentHp <= 0)) {
                combatLog("Victory!");
                setTimeout(endCombat, 1500, true);
                return;
            }
            if (currentRun.party.every(p => !p || p.currentHp <= 0)) {
                combatLog("Defeat...");
                setTimeout(() => showScreen('screen-menu'), 2000);
                return;
            }

            const unit = currentRun.turnOrder[currentRun.activeTurnIndex];
            if (!unit || unit.currentHp <= 0) {
                advanceTurn();
                return;
            }

            if (unit.stunned > 0) {
                combatLog(`${unit.name} is stunned and skips their turn!`);
                unit.stunned--;
                setTimeout(advanceTurn, 1000);
                return;
            }

            if (unit.sleep > 0) {
                combatLog(`${unit.name} is asleep and skips their turn!`);
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
            combatState.isPlayerTurn = false;
            updateCombatUI();
            const unit = currentRun.turnOrder[currentRun.activeTurnIndex];
            if (unit && unit.currentHp > 0) {
                unit.energy = Math.min(3, unit.energy + 1);
                
                // Decay buffs
                if (unit.buffs) {
                    unit.buffs.forEach(b => b.turns--);
                    unit.buffs = unit.buffs.filter(b => b.turns > 0);
                    
                    // Recalculate mods
                    unit.atkMod = 0;
                    unit.spdMod = 0;
                    unit.defMod = 1.0;
                    unit.buffs.forEach(b => {
                        if (b.type === 'atk_buff') unit.atkMod += b.value;
                        if (b.type === 'spd_buff') unit.spdMod += b.value;
                        if (b.type === 'guard') unit.defMod = b.value;
                        if (b.type === 'regen') {
                            const healAmount = b.value;
                            unit.currentHp = Math.min(unit.hp, unit.currentHp + healAmount);
                            combatLog(`${unit.name} regenerated ${healAmount} HP!`);
                        }
                    });
                }

                // Decay debuffs
                if (unit.debuffs) {
                    unit.debuffs.forEach(d => d.turns--);
                    unit.debuffs = unit.debuffs.filter(d => d.turns > 0);
                    
                    unit.debuffs.forEach(d => {
                        if (d.type === 'atk_debuff') unit.atkMod -= d.value;
                    });
                }

                // Poison
                if (unit.poison > 0 && unit.poisonTurns > 0) {
                    const dmg = unit.poison;
                    unit.currentHp -= dmg;
                    unit.poisonTurns--;
                    if (unit.poisonTurns <= 0) unit.poison = 0;
                    
                    combatLog(`${unit.name} took ${dmg} poison damage!`);
                    if (unit.currentHp <= 0) {
                        combatLog(`${unit.name} fainted from poison!`);
                        if (!unit.isEnemy) {
                            currentRun.party = currentRun.party.map(p => p && p.currentHp > 0 ? p : null);
                        }
                        calculateTurnOrder(); // Refresh order if someone died
                    }
                }
            }
            currentRun.activeTurnIndex = (currentRun.activeTurnIndex + 1) % currentRun.turnOrder.length;
            combatState.turnJustStarted = true;
            nextTurn();
        }

        function renderMoveControls(unit) {
            const container = document.getElementById('move-controls');
            container.innerHTML = '';
            
            const currentEnergy = unit.energy;

            unit.moves.forEach(m => {
                const btn = document.createElement('button');
                const moveType = m.t || '';
                btn.className = `move-btn ${moveType.toLowerCase()}`;
                const isTargetingThis = combatState.targetingMove === m;
                if (isTargetingThis) btn.style.background = 'gold';
                
                btn.disabled = currentEnergy < m.c;
                btn.innerHTML = `
                    <div style="display:flex; flex-direction:row; align-items:center; gap: 5px;">
                        <span style="font-weight:bold; font-size:16px;">${m.n}</span>
                        <span style="display:flex; align-items:center;">${getElementIcon(moveType) ? `<img src="${getElementIcon(moveType)}" style="width:20px; height:20px;" alt="${moveType}" />` : moveType}</span>
                    </div>
                    <span class="move-cost">${m.c} EN</span>
                `;
                btn.onclick = () => {
                    const targetType = m.effect?.target || "enemy";
                    if (targetType === "self" || targetType === "all_allies" || targetType === "all_enemies") {
                        executeMove(unit, m, unit); // target doesn't matter for AoE/self
                    } else {
                        combatState.targetingMove = m;
                        combatLog("Select a target!");
                        updateCombatUI();
                        renderMoveControls(unit);
                    }
                };
                container.appendChild(btn);
            });
        }

        function executeMove(attacker, move, target) {
            if (attacker.energy < move.c) return;
            attacker.energy -= move.c;
            combatState.targetingMove = null;

            const targetType = move.effect?.target || "enemy";
            let targets = [];

            if (targetType === "self") {
                targets = [attacker];
            } else if (targetType === "all_allies") {
                targets = attacker.isEnemy ? combatState.enemies.filter(e => e && e.currentHp > 0) : currentRun.party.filter(p => p && p.currentHp > 0);
            } else if (targetType === "all_enemies") {
                targets = attacker.isEnemy ? currentRun.party.filter(p => p && p.currentHp > 0) : combatState.enemies.filter(e => e && e.currentHp > 0);
            } else if (targetType === "ally") {
                if (!target) {
                    const allies = attacker.isEnemy ? combatState.enemies : currentRun.party;
                    const aliveAllies = allies.filter(a => a && a.currentHp > 0);
                    aliveAllies.sort((a, b) => (a.currentHp / a.hp) - (b.currentHp / b.hp));
                    target = aliveAllies[0];
                }
                targets = [target];
            } else { // enemy
                if (!target) {
                    const enemies = attacker.isEnemy ? currentRun.party : combatState.enemies;
                    const aliveEnemies = enemies.filter(e => e && e.currentHp > 0);
                    if (aliveEnemies.length > 0) {
                        target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                    }
                }
                if (target) targets = [target];
            }

            combatLog(`${attacker.name} used ${move.n}!`);

            targets.forEach(t => {
                if (!t || t.currentHp <= 0) return;

                // Damage
                if (move.p > 0) {
                    let damage = calculateDamage(attacker, move, t);
                    
                    // Apply Guard reduction
                    if (t.defMod < 1.0) {
                        damage = Math.floor(damage * t.defMod);
                        t.defMod = 1.0; // Guard is consumed on hit
                        if (t.buffs) {
                            t.buffs = t.buffs.filter(b => b.type !== 'guard');
                        }
                    }

                    t.currentHp -= damage;
                    combatLog(`${t.name} took ${damage} damage!`);

                    // Wake up if sleeping
                    if (t.sleep > 0) {
                        t.sleep = 0;
                        combatLog(`${t.name} woke up!`);
                    }
                }

                // Effects
                if (move.effect) {
                    const eff = move.effect;
                    if (eff.type === 'atk_buff' || eff.type === 'spd_buff' || eff.type === 'guard' || eff.type === 'savage_stance' || eff.type === 'regen') {
                        if (!t.buffs) t.buffs = [];
                        
                        if (eff.type === 'savage_stance') {
                            t.buffs.push({ type: 'atk_buff', value: eff.atk_value, turns: eff.atk_turns });
                            t.buffs.push({ type: 'guard', value: eff.guard_value, turns: eff.guard_turns });
                            t.atkMod += eff.atk_value;
                            t.defMod = eff.guard_value;
                            combatLog(`${t.name} entered Savage Stance!`);
                        } else {
                            t.buffs.push({ ...eff });
                            if (eff.type === 'atk_buff') t.atkMod += eff.value;
                            if (eff.type === 'spd_buff') t.spdMod += eff.value;
                            if (eff.type === 'guard') t.defMod = eff.value;
                            if (eff.type === 'regen') combatLog(`${t.name} gained Health Regen!`);
                            else combatLog(`${t.name} boosted stats!`);
                        }
                    } else if (eff.type === 'atk_debuff') {
                        if (!t.debuffs) t.debuffs = [];
                        t.debuffs.push({ ...eff });
                        t.atkMod -= eff.value;
                        combatLog(`${t.name}'s attack was lowered!`);
                    } else if (eff.type === 'heal') {
                        const amount = Math.floor((attacker.atk + (attacker.atkMod || 0)) * 1.5 * (move.p || 1.0));
                        t.currentHp = Math.min(t.hp, t.currentHp + amount);
                        combatLog(`${t.name} was healed for ${amount}!`);
                    } else if (eff.type === 'stun' && Math.random() < eff.chance) {
                        t.stunned = eff.turns;
                        combatLog(`${t.name} was stunned!`);
                    } else if (eff.type === 'sleep' && Math.random() < eff.chance) {
                        t.sleep = eff.turns;
                        combatLog(`${t.name} fell asleep!`);
                    } else if (eff.type === 'poison') {
                        t.poison = eff.value;
                        t.poisonTurns = eff.turns;
                        combatLog(`${t.name} was poisoned!`);
                    }
                }

                if (t.currentHp <= 0) {
                    if (t.isEnemy && !combatState.firstKilledEnemy) {
                        combatState.firstKilledEnemy = t;
                    } else if (!t.isEnemy) {
                        combatLog(`${t.name} has fallen!`);
                        currentRun.party = currentRun.party.map(p => p && p.currentHp > 0 ? p : null);
                        calculateTurnOrder();
                    }
                }
            });

            updateCombatUI();
            
            // If enemy, check if can move again
            if (attacker.isEnemy) {
                setTimeout(() => enemyAI(attacker), 800);
            } else {
                // For player, just re-render controls
                renderMoveControls(attacker);
                // Check if enemies all dead
                if (combatState.enemies.every(e => !e || e.currentHp <= 0)) {
                    setTimeout(nextTurn, 500);
                } else if (attacker.energy === 0) {
                    setTimeout(advanceTurn, 500);
                }
            }
        }

        function calculateDamage(attacker, move, target) {
            const moveType = move.t;
            const targetTypes = Array.isArray(target.type) ? target.type : [target.type];

            let maxMult = 1;
            targetTypes.forEach(bt => {
                let currentMult = 1;
                if (moveType === ELEMENTS.BEAST && bt === ELEMENTS.NATURE) currentMult = 2;
                if (moveType === ELEMENTS.NATURE && bt === ELEMENTS.MECH) currentMult = 2;
                if (moveType === ELEMENTS.MECH && bt === ELEMENTS.BEAST) currentMult = 2;

                if (moveType === ELEMENTS.NATURE && bt === ELEMENTS.BEAST) currentMult = 0.5;
                if (moveType === ELEMENTS.MECH && bt === ELEMENTS.NATURE) currentMult = 0.5;
                if (moveType === ELEMENTS.BEAST && bt === ELEMENTS.MECH) currentMult = 0.5;
                
                if (currentMult > maxMult) maxMult = currentMult;
            });

            let finalDamage = (attacker.atk + (attacker.atkMod || 0)) * maxMult * (move.p || 1.0) * (target.defMod || 1.0);
            return Math.floor(finalDamage);
        }

        function enemyAI(unit) {
            // Check if win/loss already
            if (combatState.enemies.every(e => !e || e.currentHp <= 0) || currentRun.party.every(p => !p || p.currentHp <= 0)) return;

            const affordableMoves = unit.moves.filter(m => m.c <= unit.energy);
            
            // AI logic: 
            // 1. If low energy (1), 60% chance to save energy and end turn
            if (unit.energy <= 1 && Math.random() < 0.6) {
                combatLog(`${unit.name} is waiting...`);
                setTimeout(advanceTurn, 800);
                return;
            }

            if (affordableMoves.length > 0) {
                // Pick a move
                affordableMoves.sort((a, b) => b.c - a.c);
                const move = Math.random() < 0.7 ? affordableMoves[0] : affordableMoves[Math.floor(Math.random() * affordableMoves.length)];
                
                executeMove(unit, move);
            } else {
                // No moves affordable, end turn
                setTimeout(advanceTurn, 800);
            }
        }

        function combatLog(msg) {
            combatState.log.push(msg);
            updateCombatUI();
        }

        function endCombat(isWin) {
            if (combatState.ended) return;
            combatState.ended = true;

            if (isWin) {
                // Recruitment
                if (combatState.firstKilledEnemy) {
                    const e = combatState.firstKilledEnemy;
                    const isStarter = Object.keys(STARTERS).includes(e.baseId);
                    const isAlpha = e.name.includes('Alpha');
                    
                    if (isStarter && !isAlpha) {
                        const base = STARTERS[e.baseId];
                        const recruit = { 
                            ...base, 
                            isEnemy: false, 
                            currentHp: base.hp, // FULL HP
                            hp: base.hp,
                            atk: base.atk
                        };
                        
                        const emptyIndex = currentRun.party.findIndex(p => p === null);
                        if (emptyIndex !== -1) {
                            currentRun.party[emptyIndex] = recruit;
                            // Unlock in collection
                            if (!gameState.unlockedStarters.includes(recruit.id)) {
                                gameState.unlockedStarters.push(recruit.id);
                                saveGame();
                            }
                            showGameAlert("Recruitment", `Defeated ${recruit.name} joined your party and is now unlocked in your Collection!`, advanceRun);
                            return;
                        } else {
                            showGameConfirm("Recruitment", `Your party is full. Replace a monster with ${recruit.name}? (This will also unlock it in your Collection)`, 
                                () => openReplacementModal(recruit), 
                                advanceRun
                            );
                            return;
                        }
                    }
                }
                advanceRun();
            }
        }

        function openReplacementModal(recruit) {
            const modal = document.getElementById('modal-selection');
            const list = document.getElementById('modal-list');
            document.getElementById('modal-title').innerText = "Select to Replace";
            list.innerHTML = '';
            
            const closeBtn = document.getElementById('modal-selection-close-btn');
            closeBtn.onclick = () => {
                closeModal('modal-selection');
                advanceRun();
            };
            
            list.className = 'collection-grid';
            
            currentRun.party.forEach((m, idx) => {
                if (!m) return;
                const btn = document.createElement('div');
                btn.className = 'collection-square';
                
                const types = (Array.isArray(m.type) ? m.type : [m.type]).filter(Boolean);
                const typeHtml = types.map(t => {
                    const icon = getElementIcon(t);
                    return icon ? `<img src="${icon}" style="width:28px; height:28px;" alt="${t}" title="${t}" />` : `<div class="type-tag type-${t.toLowerCase()}" style="font-size: 10px; padding: 2px 4px;">${t}</div>`;
                }).join('');

                btn.innerHTML = `
                    <div style="height:80px; display:flex; justify-content:center; align-items:center; margin-bottom:5px;">${renderArt(m.art, 60)}</div>
                    <strong>${m.name}</strong>
                    <div style="display:flex; gap:2px; margin-top:2px; justify-content:center;">${typeHtml}</div>
                    <button style="margin-top: 10px; width: 100%;">Replace</button>
                `;
                btn.querySelector('button').onclick = () => {
                    currentRun.party[idx] = recruit;
                    // Unlock in collection
                    if (!gameState.unlockedStarters.includes(recruit.id)) {
                        gameState.unlockedStarters.push(recruit.id);
                        saveGame();
                    }
                    closeModal('modal-selection');
                    advanceRun();
                };
                list.appendChild(btn);
            });
            modal.style.display = 'flex';
        }

        function advanceRun() {
            currentRun.nodeIndex++;
            if (currentRun.nodeIndex >= currentRun.nodes.length) {
                // Victory Run
                const allStarterIds = Object.keys(STARTERS);
                const locked = allStarterIds.filter(id => !gameState.unlockedStarters.includes(id));
                if (locked.length > 0) {
                    const newId = locked[Math.floor(Math.random() * locked.length)];
                    gameState.unlockedStarters.push(newId);
                    alert(`RUN COMPLETE! Unlocked new starter: ${STARTERS[newId].name}`);
                } else {
                    alert(`RUN COMPLETE! All starters already unlocked.`);
                }
                saveGame();
                showScreen('screen-menu');
            } else {
                showScreen('screen-map');
                renderMap();
            }
        }