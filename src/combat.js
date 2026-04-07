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

            if (combatState.enemies.some(e => e && e.isBoss)) {
                enemyTeam.classList.add('boss-team');
            } else {
                enemyTeam.classList.remove('boss-team');
            }

            while (enemyTeam.children.length < 4) enemyTeam.appendChild(document.createElement('div'));
            while (enemyTeam.children.length > 4) enemyTeam.removeChild(enemyTeam.lastChild);
            while (playerTeam.children.length < 4) playerTeam.appendChild(document.createElement('div'));
            while (playerTeam.children.length > 4) playerTeam.removeChild(playerTeam.lastChild);

            combatState.enemies.forEach((e, index) => {
                const child = enemyTeam.children[index];
                if (e) {
                    updateCombatantEl(child, e);
                } else {
                    child.className = 'combatant empty';
                    child.innerHTML = '';
                    child.onclick = null;
                }
            });
            currentRun.party.forEach((p, index) => {
                const child = playerTeam.children[index];
                if (p) {
                    updateCombatantEl(child, p);
                } else {
                    child.className = 'combatant empty';
                    child.innerHTML = '';
                    child.onclick = null;
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
                
                let typeIconHtml = '';
                if (types.length === 2) {
                    if (types.includes('Beast') && types.includes('Mech')) typeIconHtml = `<img src="/Art/BeastMech.png" style="width:32px; height:32px; vertical-align:middle;" title="Beast/Mech" />`;
                    else if (types.includes('Mech') && types.includes('Nature')) typeIconHtml = `<img src="/Art/MechNature.png" style="width:32px; height:32px; vertical-align:middle;" title="Mech/Nature" />`;
                    else if (types.includes('Nature') && types.includes('Beast')) typeIconHtml = `<img src="/Art/NatureBeast.png" style="width:32px; height:32px; vertical-align:middle;" title="Nature/Beast" />`;
                } else if (types.length === 1) {
                    const icon = getElementIcon(types[0]);
                    if (icon) typeIconHtml = `<img src="${icon}" style="width:32px; height:32px; vertical-align:middle;" title="${types[0]}" />`;
                }

                infoEl.innerHTML = `<span style="vertical-align:middle;">${combatState.activeUnit.name}</span> <span style="display:inline-flex; gap:2px; vertical-align:middle;">${typeIconHtml}</span>`;
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

        function updateCombatantEl(div, u) {
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
                const goodStyle = 'width:40px; height:40px; filter: drop-shadow(0 0 5px rgba(0,255,0,0.8));';
                const badStyle = 'width:40px; height:40px; filter: drop-shadow(0 0 5px rgba(255,0,0,0.8));';
                if (u.poison > 0) statusHtml += `<img src="/Art/Poison.png" style="${badStyle}" title="Poisoned" />`;
                if (u.sleep > 0) statusHtml += `<img src="/Art/Sleep.png" style="${badStyle}" title="Sleeping" />`;
                if (u.stunned > 0) statusHtml += `<img src="/Art/Stun.png" style="${badStyle}" title="Stunned" />`;
                if (u.buffs && u.buffs.some(b => b.type === 'regen')) statusHtml += `<img src="/Art/Regen.png" style="${goodStyle}" title="Regen" />`;
                if (u.defMod < 1.0) statusHtml += `<img src="/Art/Guard.png" style="${goodStyle}" title="Guarded" />`;
                if (u.atkMod > 0) statusHtml += `<img src="/Art/Buff DMG.png" style="${goodStyle}" title="ATK Up" />`;
                if (u.atkMod < 0) statusHtml += `<img src="/Art/Debuff DMG.png" style="${badStyle}" title="ATK Down" />`;
                if (u.spdMod > 0) statusHtml += `<img src="/Art/Buff SPD.png" style="${goodStyle}" title="SPD Up" />`;
            }

            let typeIconHtml = '';
            if (types.length === 2) {
                if (types.includes('Beast') && types.includes('Mech')) typeIconHtml = `<img src="/Art/BeastMech.png" style="width:40px; height:40px;" title="Beast/Mech" />`;
                else if (types.includes('Mech') && types.includes('Nature')) typeIconHtml = `<img src="/Art/MechNature.png" style="width:40px; height:40px;" title="Mech/Nature" />`;
                else if (types.includes('Nature') && types.includes('Beast')) typeIconHtml = `<img src="/Art/NatureBeast.png" style="width:40px; height:40px;" title="Nature/Beast" />`;
            } else if (types.length === 1) {
                const icon = getElementIcon(types[0]);
                if (icon) typeIconHtml = `<img src="${icon}" style="width:40px; height:40px;" title="${types[0]}" />`;
            }

            const iconPosition = u.isEnemy ? 'right: -10px;' : 'left: -10px;';

            if (!div.querySelector('.hp-fill')) {
                div.innerHTML = `
                    <div class="monster-art-container" style="position: relative;">
                        <div class="art-content">${artHtml}</div>
                        <div class="shadow-ellipse"></div>
                        <div class="status-container" style="position: absolute; bottom: 0; left: 0; width: 100%; display:flex; justify-content:center; gap:4px; z-index: 10;">
                            ${statusHtml}
                        </div>
                    </div>
                    <div class="stats-container" style="position: relative; padding-top: 10px;">
                        <div class="type-icon-container" style="position: absolute; top: -10px; ${iconPosition} z-index: 11;">
                            ${typeIconHtml}
                        </div>
                        <div class="name" style="text-align: center; color: white; font-weight: bold; font-size: 14px; text-shadow: 1px 1px 2px black; margin-bottom: 4px;">
                            ${u.name}
                        </div>
                        <div class="hp-bar" style="margin-bottom: 4px;"><div class="hp-fill" style="width:${hpPerc}%; background-color:${hpColor}; transition: width 1.5s ease-out, background-color 1.5s ease-out;"></div></div>
                    </div>
                `;
            } else {
                div.querySelector('.art-content').innerHTML = artHtml;
                div.querySelector('.status-container').innerHTML = statusHtml;
                div.querySelector('.type-icon-container').innerHTML = typeIconHtml;
                div.querySelector('.type-icon-container').style.cssText = `position: absolute; top: -10px; ${iconPosition} z-index: 11;`;
                div.querySelector('.name').innerHTML = u.name;
                
                const hpFill = div.querySelector('.hp-fill');
                hpFill.style.width = `${hpPerc}%`;
                hpFill.style.backgroundColor = hpColor;
            }

            if (u === combatState.activeUnit) div.classList.add('active-turn');
            else div.classList.remove('active-turn');
            
            if (isTargetable) {
                div.onclick = () => executeMove(combatState.activeUnit, combatState.targetingMove, u);
            } else {
                div.onclick = null;
            }
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
                setTimeout(() => endCombat(false), 2000);
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
                if (move.p > 0 && move.effect?.type !== 'heal') {
                    const hitCount = move.hits || 1;
                    const dmgMultiplier = 1.0 / hitCount;

                    for (let i = 0; i < hitCount; i++) {
                        if (t.currentHp <= 0) break;
                        
                        // Pass dmgMultiplier to calculateDamage or multiply it here
                        let damage = calculateDamage(attacker, move, t);
                        damage = Math.max(1, Math.floor(damage * dmgMultiplier));
                        
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
            
            // Check win/loss immediately after move
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

            // If enemy, check if can move again
            if (attacker.isEnemy) {
                setTimeout(() => enemyAI(attacker), 800);
            } else {
                // For player, just re-render controls
                renderMoveControls(attacker);
                if (attacker.energy === 0) {
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
                // If it's the final boss, show You Win screen
                if (currentRun.nodeIndex >= currentRun.nodes.length - 1) {
                    advanceRun();
                    return;
                }

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
            } else {
                showGameAlert("YOU DIED!", "Your party was defeated.", () => {
                    showScreen('screen-menu');
                });
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
                let msg = "Congratulations! You have completed the run.";
                if (locked.length > 0) {
                    const newId = locked[Math.floor(Math.random() * locked.length)];
                    gameState.unlockedStarters.push(newId);
                    msg += `\nUnlocked new starter: ${STARTERS[newId].name}`;
                } else {
                    msg += `\nAll starters already unlocked.`;
                }
                saveGame();
                showGameAlert("YOU WIN!", msg, () => {
                    showScreen('screen-menu');
                });
            } else {
                showScreen('screen-map');
                renderMap();
            }
        }