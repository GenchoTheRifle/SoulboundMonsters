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
                p.energy = p.startingEnergy !== undefined ? p.startingEnergy : 1;
                p.atkMod = 0;
                p.spdMod = 0;
                p.defMod = 1.0;
                p.buffs = [];
                p.stunned = false;
                p.poison = 0;
            });

            calculateTurnOrder();
            updateCombatUI();
            nextTurn();
        }
        function calculateTurnOrder() {
            const all = [...currentRun.party, ...combatState.enemies].filter(u => u.currentHp > 0);
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

            if (combatState.enemies.some(e => e.isBoss)) {
                enemyTeam.classList.add('boss-team');
            } else {
                enemyTeam.classList.remove('boss-team');
            }

            combatState.enemies.forEach(e => enemyTeam.appendChild(createCombatantEl(e)));
            currentRun.party.forEach(p => playerTeam.appendChild(createCombatantEl(p)));

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
                const types = Array.isArray(combatState.activeUnit.type) ? combatState.activeUnit.type : [combatState.activeUnit.type];
                infoEl.innerHTML = `${combatState.activeUnit.name} (${types.join('/')})`;
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
                if (combatState.targetingMove.n.includes('Heal')) {
                    isTargetable = !u.isEnemy;
                } else {
                    isTargetable = u.isEnemy;
                }
            }

            div.className = `combatant ${u.currentHp <= 0 ? 'dead' : ''} ${isTargetable ? 'targetable' : ''} ${u.isEnemy ? 'enemy' : 'ally'} ${u.isBoss ? 'boss' : ''}`;
            const hpPerc = Math.max(0, (u.currentHp / u.hp) * 100);
            const types = Array.isArray(u.type) ? u.type : [u.type];
            
            let artHtml = '';
            if (u.art.includes('.png') || u.art.includes('/')) {
                artHtml = `<img src="${u.art}" alt="${u.name}" />`;
            } else {
                artHtml = `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${u.art}</div>`;
            }

            div.innerHTML = `
                <div class="type-container" style="position:absolute; top:-15px; left:50%; transform:translateX(-50%); z-index:3;">
                    ${types.map(t => `<div class="type-tag type-${t.toLowerCase()}" style="font-size:8px; padding:2px 4px;">${t}</div>`).join('')}
                </div>
                <div class="monster-art-container">
                    ${artHtml}
                    <div class="shadow-ellipse"></div>
                </div>
                <div class="stats-container">
                    <div class="name">Lv.1 ${u.name}</div>
                    <div class="hp-bar"><div class="hp-fill" style="width:${hpPerc}%"></div></div>
                    <div style="font-size:8px; color:#ccc; margin-top:2px;">${u.currentHp}/${u.hp}</div>
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
            if (combatState.enemies.every(e => e.currentHp <= 0)) {
                combatLog("Victory!");
                setTimeout(endCombat, 1500, true);
                return;
            }
            if (currentRun.party.every(p => p.currentHp <= 0)) {
                combatLog("Defeat...");
                setTimeout(() => showScreen('screen-menu'), 2000);
                return;
            }

            const unit = currentRun.turnOrder[currentRun.activeTurnIndex];
            if (!unit || unit.currentHp <= 0) {
                advanceTurn();
                return;
            }

            if (unit.stunned) {
                combatLog(`${unit.name} is stunned and skips their turn!`);
                unit.stunned = false;
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
                        if (b.type === 'def_buff') unit.defMod *= b.value;
                    });
                }

                // Poison
                if (unit.poison > 0) {
                    const dmg = unit.poison;
                    unit.currentHp -= dmg;
                    combatLog(`${unit.name} took ${dmg} poison damage!`);
                    if (unit.currentHp <= 0) {
                        combatLog(`${unit.name} fainted from poison!`);
                        if (!unit.isEnemy) {
                            currentRun.party = currentRun.party.filter(p => p.currentHp > 0);
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
                btn.className = `move-btn ${m.t.toLowerCase()}`;
                const isTargetingThis = combatState.targetingMove === m;
                if (isTargetingThis) btn.style.background = 'gold';
                
                btn.disabled = currentEnergy < m.c;
                btn.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:flex-start">
                        <span style="font-weight:bold">${m.n}</span>
                        <span style="font-size:9px; opacity:0.8">${m.t}</span>
                    </div>
                    <span class="move-cost">${m.c} EN</span>
                `;
                btn.onclick = () => {
                    if (m.n.includes('Guard') || m.n.includes('Howl') || m.n.includes('Overcharge')) {
                        executeMove(unit, m, unit);
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

            if (move.effect) {
                const eff = move.effect;
                if (eff.type === 'atk_buff' || eff.type === 'spd_buff' || eff.type === 'def_buff') {
                    attacker.buffs.push({ ...eff });
                    // Apply immediately
                    if (eff.type === 'atk_buff') attacker.atkMod += eff.value;
                    if (eff.type === 'spd_buff') attacker.spdMod += eff.value;
                    if (eff.type === 'def_buff') attacker.defMod *= eff.value;
                    combatLog(`${attacker.name} used ${move.n} and boosted stats!`);
                } else if (eff.type === 'heal') {
                    // Handled below if name contains Heal, but let's make it generic
                }
            }

            if (move.n.includes('Heal')) {
                const amount = Math.floor((attacker.atk + (attacker.atkMod || 0)) * 1.5 * (move.p || 1.0));
                target.currentHp = Math.min(target.hp, target.currentHp + amount);
                combatLog(`${attacker.name} used ${move.n} and healed ${target.name} for ${amount}!`);
            } else if (move.n.includes('Guard') || move.n.includes('Howl') || move.n.includes('Overcharge')) {
                // Buffs handled above by move.effect
                if (!move.effect) combatLog(`${attacker.name} used ${move.n}! (Buffed)`);
            } else {
                // If no target provided (e.g. enemy AI), pick random
                if (!target) {
                    const targets = attacker.isEnemy ? currentRun.party : combatState.enemies;
                    const aliveTargets = targets.filter(t => t.currentHp > 0);
                    if (aliveTargets.length > 0) {
                        target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
                    }
                }

                if (target) {
                    const damage = calculateDamage(attacker, move, target);
                    target.currentHp -= damage;
                    combatLog(`${attacker.name} used ${move.n} on ${target.name} for ${damage}!`);
                    
                    // Apply target effects
                    if (move.effect) {
                        const eff = move.effect;
                        if (eff.type === 'stun' && Math.random() < eff.chance) {
                            target.stunned = true;
                            combatLog(`${target.name} was stunned!`);
                        }
                        if (eff.type === 'poison') {
                            target.poison = eff.value;
                            combatLog(`${target.name} was poisoned!`);
                        }
                    }

                    if (target.currentHp <= 0) {
                        if (target.isEnemy && !combatState.firstKilledEnemy) {
                            combatState.firstKilledEnemy = target;
                        } else if (!target.isEnemy) {
                            combatLog(`${target.name} has fallen!`);
                            currentRun.party = currentRun.party.filter(p => p.currentHp > 0);
                            calculateTurnOrder();
                        }
                    }
                }
            }

            updateCombatUI();
            
            // If enemy, check if can move again
            if (attacker.isEnemy) {
                setTimeout(() => enemyAI(attacker), 800);
            } else {
                // For player, just re-render controls
                renderMoveControls(attacker);
                // Check if enemies all dead
                if (combatState.enemies.every(e => e.currentHp <= 0)) {
                    setTimeout(nextTurn, 500);
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
            if (combatState.enemies.every(e => e.currentHp <= 0) || currentRun.party.every(p => p.currentHp <= 0)) return;

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
                
                // If it's a heal, target an ally with lowest HP
                if (move.n.includes('Heal')) {
                    const allies = combatState.enemies.filter(e => e.currentHp > 0);
                    allies.sort((a, b) => (a.currentHp / a.hp) - (b.currentHp / b.hp));
                    executeMove(unit, move, allies[0]);
                } else {
                    executeMove(unit, move);
                }
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
                        
                        if (currentRun.party.length < 4) {
                            currentRun.party.push(recruit);
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
            
            currentRun.party.forEach((m, idx) => {
                const btn = document.createElement('button');
                btn.style.width = '100%';
                btn.innerHTML = `Replace ${m.name}`;
                btn.onclick = () => {
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