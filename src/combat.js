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

        let isExecutingMove = false;

        function initCombat(node) {
            isExecutingMove = false;
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
                let bossId = 'mega_bat';
                if (currentRun.arcId === 'arc2') bossId = 'mega_treant';
                if (currentRun.arcId === 'arc3') bossId = 'mega_mech';
                
                const base = BOSSES[bossId];
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
                    defMod: 0,
                    buffs: [],
                    debuffs: [],
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
                    const enemyMatk = Math.floor(base.matk * levelMult * 0.8);
                    const enemyRatk = Math.floor(base.ratk * levelMult * 0.8);

                    combatState.enemies.push({
                        ...base,
                        baseId: base.id, // Keep track of base ID for recruitment
                        hp: enemyHp,
                        currentHp: enemyHp,
                        matk: enemyMatk,
                        ratk: enemyRatk,
                        isEnemy: true,
                        id: `enemy-${Date.now()}-${i}`,
                        energy: base.startingEnergy !== undefined ? base.startingEnergy : 1,
                        atkMod: 0,
                        spdMod: 0,
                        defMod: 0,
                        buffs: [],
                        debuffs: [],
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
                p.defMod = 0;
                p.buffs = [];
                p.debuffs = [];
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
        function calculateTurnOrder(isMidCombat = false) {
            const all = [...currentRun.party, ...combatState.enemies].filter(u => u && u.currentHp > 0);
            all.sort((a, b) => {
                const spdA = a.spd * (1 + (a.spdMod || 0));
                const spdB = b.spd * (1 + (b.spdMod || 0));
                return spdB - spdA;
            });
            
            if (isMidCombat && currentRun.turnOrder) {
                const currentUnit = currentRun.turnOrder[currentRun.activeTurnIndex];
                currentRun.turnOrder = all;
                const newIndex = currentRun.turnOrder.findIndex(u => u === currentUnit);
                currentRun.activeTurnIndex = newIndex !== -1 ? newIndex : 0;
            } else {
                currentRun.turnOrder = all;
                currentRun.activeTurnIndex = 0;
            }
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

            for (let i = 0; i < 4; i++) {
                const child = enemyTeam.children[i];
                const e = combatState.enemies[i];
                if (e) {
                    updateCombatantEl(child, e, i);
                } else {
                    child.className = 'combatant empty';
                    child.innerHTML = '';
                    child.onclick = null;
                }
            }
            currentRun.party.forEach((p, index) => {
                const child = playerTeam.children[index];
                if (p) {
                    updateCombatantEl(child, p, index);
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
                
                const typeIconHtml = getTypeIconHtml(types, 32);

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

        function animateValue(obj, start, end, duration, maxHp) {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const current = Math.floor(progress * (end - start) + start);
                obj.innerHTML = `HP: ${current}/${maxHp}`;
                obj.setAttribute('data-current-hp', current);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    obj.innerHTML = `HP: ${end}/${maxHp}`;
                    obj.setAttribute('data-current-hp', end);
                }
            };
            window.requestAnimationFrame(step);
        }

        function updateCombatantEl(div, u, index) {
            let isTargetable = false;
            let isTargeting = !!combatState.targetingMove;
            if (isTargeting && u.currentHp > 0) {
                const targetType = combatState.targetingMove.effect?.target || "enemy";
                let isCorrectSide = false;
                if (targetType === "ally") {
                    isCorrectSide = !u.isEnemy;
                } else {
                    isCorrectSide = u.isEnemy;
                }

                if (isCorrectSide) {
                    if (combatState.targetingMove.melee) {
                        const targetTeam = u.isEnemy ? combatState.enemies : currentRun.party;
                        const frontlineDead = (!targetTeam[0] || targetTeam[0].currentHp <= 0) && (!targetTeam[1] || targetTeam[1].currentHp <= 0);
                        if (index < 2 || frontlineDead) {
                            isTargetable = true;
                        }
                    } else {
                        isTargetable = true;
                    }
                }
            }

            div.className = `combatant ${u.currentHp <= 0 ? 'dead' : ''} ${isTargeting ? (isTargetable ? 'targetable' : 'not-targetable') : ''} ${u.isEnemy ? 'enemy' : 'ally'} ${u.isBoss ? 'boss' : ''}`;
            const hpPerc = Math.max(0, (u.currentHp / u.hp) * 100);
            let hpColor = '#ff6b6b';
            if (hpPerc > 66) hpColor = '#51cf66';
            else if (hpPerc > 33) hpColor = '#fcc419';

            const types = (Array.isArray(u.type) ? u.type : [u.type]).filter(Boolean);
            
            let artHtml = '';
            if (u.art.includes('.svg') || u.art.includes('/')) {
                artHtml = `<img src="${u.art}" alt="${u.name}" />`;
            } else {
                artHtml = `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${u.art}</div>`;
            }

            let statusHtml = '';
            if (u.currentHp > 0) {
                const goodStyle = 'width:40px; height:40px; filter: drop-shadow(0 0 5px rgba(0,255,0,0.8));';
                const badStyle = 'width:40px; height:40px; filter: drop-shadow(0 0 5px rgba(255,0,0,0.8));';
                
                const renderIcon = (src, style, title, turns) => {
                    let html = `<div style="position:relative; display:inline-block;">
                        <img src="${src}" style="${style}" title="${title}" />`;
                    if (turns !== undefined && turns > 0) {
                        html += `<div style="position:absolute; bottom:-2px; right:-2px; background:rgba(0,0,0,0.7); color:white; font-size:12px; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-weight:bold; z-index:2;">${turns}</div>`;
                    }
                    html += `</div>`;
                    return html;
                };

                if (u.poison > 0) statusHtml += renderIcon('Art/Poison.svg', badStyle, 'Poisoned', u.poisonTurns);
                if (u.sleep > 0) statusHtml += renderIcon('Art/Sleep.svg', badStyle, 'Sleeping', u.sleep);
                if (u.stunned > 0) statusHtml += renderIcon('Art/Stun.svg', badStyle, 'Stunned', u.stunned);
                
                if (u.buffs) {
                    const regenBuff = u.buffs.find(b => b.type === 'regen' || b.type === 'regen_flat');
                    if (regenBuff) statusHtml += renderIcon('Art/Regen.svg', goodStyle, 'Regen', regenBuff.turns);
                    
                    const atkBuff = u.buffs.find(b => b.type === 'atk_buff' || b.type === 'atk_buff_pct');
                    if (atkBuff) statusHtml += renderIcon('Art/Buff DMG.svg', goodStyle, 'ATK Up', atkBuff.turns);
                    
                    const spdBuff = u.buffs.find(b => b.type === 'spd_buff' || b.type === 'spd_buff_pct');
                    if (spdBuff) statusHtml += renderIcon('Art/Buff SPD.svg', goodStyle, 'SPD Up', spdBuff.turns);
                }
                
                if (u.debuffs) {
                    const atkDebuff = u.debuffs.find(b => b.type === 'atk_debuff' || b.type === 'atk_debuff_pct');
                    if (atkDebuff) statusHtml += renderIcon('Art/Debuff DMG.svg', badStyle, 'ATK Down', atkDebuff.turns);
                }

                if (u.defMod > 0) statusHtml += renderIcon('Art/Guard.svg', goodStyle, 'Guarded');
            }

            const typeIconHtml = getTypeIconHtml(types, 40);

            const iconPosition = u.isEnemy ? 'right: -10px;' : 'left: -10px;';

            if (!div.querySelector('.hp-fill') || !div.querySelector('.hp-text')) {
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
                        <div class="hp-text" style="text-align: center; color: white; font-size: 12px; font-weight: bold; text-shadow: 1px 1px 2px black;" data-current-hp="${Math.ceil(u.currentHp)}">
                            HP: ${Math.ceil(u.currentHp)}/${u.hp}
                        </div>
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

                const hpTextEl = div.querySelector('.hp-text');
                const targetHp = Math.ceil(u.currentHp);
                const currentDisplayedHp = parseInt(hpTextEl.getAttribute('data-current-hp')) || targetHp;
                
                if (currentDisplayedHp !== targetHp) {
                    animateValue(hpTextEl, currentDisplayedHp, targetHp, 1500, u.hp);
                } else {
                    hpTextEl.innerHTML = `HP: ${targetHp}/${u.hp}`;
                }
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
            combatState.targetingMove = null;
            combatState.isPlayerTurn = false;
            updateCombatUI();
            const unit = currentRun.turnOrder[currentRun.activeTurnIndex];
            if (unit && unit.currentHp > 0) {
                unit.energy = Math.min(3, unit.energy + 1);
                
                // Decay buffs
                if (unit.buffs) {
                    unit.buffs.forEach(b => {
                        if (b.type !== 'guard' && b.type !== 'guard_pct') {
                            b.turns--;
                        }
                    });
                    unit.buffs = unit.buffs.filter(b => b.turns > 0 || b.type === 'guard' || b.type === 'guard_pct');
                    
                    // Recalculate mods
                    unit.atkMod = 0;
                    unit.spdMod = 0;
                    unit.defMod = 0;
                    unit.buffs.forEach(b => {
                        if (b.type === 'atk_buff' || b.type === 'atk_buff_pct') unit.atkMod += b.value;
                        if (b.type === 'spd_buff' || b.type === 'spd_buff_pct') unit.spdMod += b.value;
                        if (b.type === 'guard' || b.type === 'guard_pct') unit.defMod = b.value;
                        if (b.type === 'regen' || b.type === 'regen_flat') {
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
                        if (d.type === 'atk_debuff' || d.type === 'atk_debuff_pct') unit.atkMod -= d.value;
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
                        calculateTurnOrder(true); // Refresh order if someone died
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

        async function executeMove(attacker, move, target) {
            if (isExecutingMove) return;
            if (attacker.energy < move.c) return;
            isExecutingMove = true;
            attacker.energy -= move.c;
            combatState.targetingMove = null;
            document.getElementById('move-controls').innerHTML = ''; // Disable UI during move

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
                        let validTargets = aliveEnemies;
                        if (move.melee) {
                            const frontline = enemies.slice(0, 2).filter(e => e && e.currentHp > 0);
                            if (frontline.length > 0) validTargets = frontline;
                        }
                        target = validTargets[Math.floor(Math.random() * validTargets.length)];
                    }
                }
                if (target) targets = [target];
            }

            combatLog(`${attacker.name} used ${move.n}!`);

            for (const t of targets) {
                if (!t || t.currentHp <= 0) continue;

                // Damage
                if (move.p > 0 && !move.effect?.type.includes('heal')) {
                    const hitCount = move.hits || 1;

                    for (let i = 0; i < hitCount; i++) {
                        if (t.currentHp <= 0) break;
                        
                        let damage = calculateDamage(attacker, move, t);
                        damage = Math.max(1, Math.floor(damage));
                        
                        // Guard reduction is already applied in calculateDamage, but we need to consume it
                        if (t.defMod > 0) {
                            t.defMod = 0; // Guard is consumed on hit
                            if (t.buffs) {
                                t.buffs = t.buffs.filter(b => b.type !== 'guard' && b.type !== 'guard_pct');
                            }
                        }

                        t.currentHp -= damage;
                        combatLog(`${t.name} took ${damage} damage!`);

                        // Wake up if sleeping
                        if (t.sleep > 0) {
                            t.sleep = 0;
                            combatLog(`${t.name} woke up!`);
                        }
                        
                        updateCombatUI();

                        if (hitCount > 1 && i < hitCount - 1) {
                            await new Promise(r => setTimeout(r, 400));
                        }
                    }
                }

                // Effects
                if (move.effect) {
                    const eff = move.effect;
                    if (eff.type.includes('debuff')) {
                        if (!t.debuffs) t.debuffs = [];
                        t.debuffs.push({ ...eff });
                        if (eff.type.includes('atk_debuff')) t.atkMod -= eff.value;
                        combatLog(`${t.name}'s stats were lowered!`);
                    } else if (eff.type.includes('buff') || eff.type.includes('guard') || eff.type.includes('savage_stance') || eff.type.includes('regen') || move.n === 'Ultimate Overcharge' || move.n === 'Overcharge') {
                        if (!t.buffs) t.buffs = [];
                        
                        if (eff.type === 'savage_stance' || eff.type === 'savage_stance_pct') {
                            t.buffs.push({ type: 'atk_buff_pct', value: eff.atk_value, turns: eff.atk_turns });
                            t.buffs.push({ type: 'guard_pct', value: eff.guard_value, turns: eff.guard_turns });
                            t.atkMod += eff.atk_value;
                            t.defMod = eff.guard_value;
                            combatLog(`${t.name} entered Savage Stance!`);
                        } else if (eff.type === 'ultimate_overcharge' || move.n === 'Ultimate Overcharge') {
                            t.buffs.push({ type: 'atk_buff_pct', value: 0.2, turns: 3 });
                            t.buffs.push({ type: 'spd_buff_pct', value: 0.3, turns: 3 });
                            t.atkMod += 0.2;
                            t.spdMod += 0.3;
                            combatLog(`${t.name} is Ultimately Overcharged!`);
                        } else {
                            const turns = move.n === 'Overcharge' ? 3 : eff.turns;
                            t.buffs.push({ ...eff, turns });
                            if (eff.type.includes('atk_buff')) t.atkMod += eff.value;
                            if (eff.type.includes('spd_buff')) t.spdMod += eff.value;
                            if (eff.type.includes('guard')) t.defMod = eff.value;
                            if (eff.type.includes('regen')) combatLog(`${t.name} gained Health Regen!`);
                            else combatLog(`${t.name} boosted stats!`);
                        }
                    } else if (eff.type.includes('heal')) {
                        const amount = eff.value || Math.floor((attacker.matk + attacker.ratk + (attacker.atkMod || 0)) * 1.5 * (move.p || 1.0));
                        t.currentHp = Math.min(t.hp, t.currentHp + amount);
                        combatLog(`${t.name} was healed for ${amount}!`);
                    } else if (eff.type === 'stun' && Math.random() < eff.chance) {
                        t.stunned = eff.turns;
                        combatLog(`${t.name} was stunned!`);
                    } else if (eff.type === 'sleep' && Math.random() < eff.chance) {
                        t.sleep = eff.turns;
                        combatLog(`${t.name} fell asleep!`);
                    } else if (eff.type.includes('poison')) {
                        let poisonDmg = 0;
                        if (move.n === 'Poison Cloud') {
                            poisonDmg = 4;
                        } else if (move.n === 'Giant Poison Cloud') {
                            poisonDmg = 8;
                        } else if (eff.type === 'poison_pct') {
                            poisonDmg = Math.floor(t.hp * eff.value);
                        } else {
                            poisonDmg = eff.value;
                        }
                        t.poison = poisonDmg;
                        t.poisonTurns = eff.turns;
                        combatLog(`${t.name} was poisoned!`);
                    }
                }

                if (t.currentHp <= 0) {
                    if (t.isEnemy && !combatState.firstKilledEnemy) {
                        combatState.firstKilledEnemy = t;
                    } else if (!t.isEnemy) {
                        combatLog(`${t.name} has fallen!`);
                        calculateTurnOrder(true);
                    }
                }
            }

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
            isExecutingMove = false;
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

            let atkStat = 0;
            let defStat = 0;
            if (move.melee) {
                atkStat = attacker.matk || 0;
                defStat = target.mdef || 0;
            } else {
                atkStat = attacker.ratk || 0;
                defStat = target.rdef || 0;
            }

            // Apply atkMod (which is a percentage buff now, e.g. 0.4 for +40%)
            let atkMod = attacker.atkMod || 0;
            let rawAttack = (atkStat * (1 + atkMod)) * (move.p || 1.0) * maxMult;
            
            // Apply defMod (which is a percentage guard, e.g. 0.4 for -40% damage)
            let defMod = target.defMod || 0; // 0 means no guard, 0.4 means 40% reduction
            
            let finalDamage = rawAttack * (100 / (100 + defStat));
            finalDamage = finalDamage * (1 - defMod);

            return Math.max(1, Math.floor(finalDamage));
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

            // Remove dead party members
            currentRun.party = currentRun.party.map(p => p && p.currentHp > 0 ? p : null);

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
                let msg = "Congratulations! You have completed the run.";
                
                let bossId = 'mega_bat';
                if (currentRun.arcId === 'arc2') bossId = 'mega_treant';
                if (currentRun.arcId === 'arc3') bossId = 'mega_mech';
                
                const bossData = BOSSES[bossId];
                if (bossData && bossData.unlocks) {
                    const unlocksId = bossData.unlocks;
                    if (!gameState.unlockedStarters.includes(unlocksId)) {
                        gameState.unlockedStarters.push(unlocksId);
                        msg += `\nUnlocked new starter: ${STARTERS[unlocksId].name}`;
                    } else {
                        msg += `\nYou already unlocked this Arc's starter.`;
                    }
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