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
            
            const arenaBg = document.getElementById('combat-arena');
            if (arenaBg && currentRun.arcId) {
                arenaBg.style.backgroundImage = getMapBackground(currentRun.arcId);
            }

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
            
            // Define pools per Act
            let simplePool = ['wolf', 'slime', 'sentry'];
            const advancedPool = ['bear', 'mushroom', 'sparkbot'];
            let extraEnemies = [];
            if (gameState.unlockedStarters.includes('bat') || gameState.maxActReached >= 2) extraEnemies.push('bat');
            if (gameState.unlockedStarters.includes('tree') || gameState.maxActReached >= 3) extraEnemies.push('tree');
            if (gameState.unlockedStarters.includes('mech_melee') || gameState.maxActReached >= 4) extraEnemies.push('mech_melee');
            extraEnemies = [...new Set(extraEnemies)];

            let allPool = [...simplePool, ...advancedPool, ...extraEnemies];

            let pool = allPool;
            if (currentRun.nodeIndex <= 3) pool = [...simplePool, ...extraEnemies]; // Nodes 1, 2, 4
            else if (currentRun.nodeIndex === 4) pool = [...advancedPool, ...extraEnemies]; // Node 5

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
                    stunned: 0,
                    poison: 0
                });
            } else {
                for (let i = 0; i < enemyCount; i++) {
                    const key = pool[Math.floor(Math.random() * pool.length)];
                    const base = STARTERS[key];
                    
                    // Enemies do not scale, they start with full base stats.
                    const enemyHp = base.hp;
                    const enemyMatk = base.matk;
                    const enemyRatk = base.ratk;
                    const enemyMdef = base.mdef;
                    const enemyRdef = base.rdef;
                    const enemySpd = base.spd;

                    combatState.enemies.push({
                        ...base,
                        baseId: base.id, // Keep track of base ID for recruitment
                        hp: enemyHp,
                        currentHp: enemyHp,
                        matk: enemyMatk,
                        ratk: enemyRatk,
                        mdef: enemyMdef,
                        rdef: enemyRdef,
                        spd: enemySpd,
                        isEnemy: true,
                        id: `enemy-${Date.now()}-${i}`,
                        energy: base.startingEnergy !== undefined ? base.startingEnergy : 1,
                        atkMod: 0,
                        spdMod: 0,
                        defMod: 0,
                        buffs: [],
                        debuffs: [],
                        stunned: 0,
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
                p.stunned = 0;
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

        
        function showFloatingText(unit, text, color) {
            const teamPrefix = unit.isEnemy ? 'enemy' : 'player';
            let index = -1;
            if (unit.isEnemy) {
                index = combatState.enemies.indexOf(unit);
            } else {
                index = currentRun.party.indexOf(unit);
            }
            if (index === -1) return;
            
            const teamContainer = document.getElementById(teamPrefix + '-team');
            if (!teamContainer || !teamContainer.children[index]) return;
            const unitEl = teamContainer.children[index];
            
            const textEl = document.createElement('div');
            textEl.className = 'floating-damage';
            textEl.style.color = color;
            textEl.innerHTML = text;
            
            unitEl.appendChild(textEl);
            
            setTimeout(() => {
                if (textEl && textEl.parentNode) {
                    textEl.parentNode.removeChild(textEl);
                }
            }, 1200);
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
                    const targetTeam = u.isEnemy ? combatState.enemies : currentRun.party;
                    const tauntingTargets = targetTeam.filter(e => e && e.currentHp > 0 && e.buffs && e.buffs.some(b => b.type === 'taunt'));
                    
                    if (tauntingTargets.length > 0) {
                        if (u.buffs && u.buffs.some(b => b.type === 'taunt')) {
                            isTargetable = true;
                        } else {
                            isTargetable = false;
                        }
                    } else if (combatState.targetingMove.melee) {
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
            if (u.art.includes('.png') || u.art.includes('/')) {
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

                const renderEmojiIcon = (emoji, style, title, turns) => {
                    let html = `<div style="position:relative; display:inline-flex; align-items:center; justify-content:center; background:#333; border-radius:5px; border: 1px solid #777; width:40px; height:40px; ${style}" title="${title}">
                        <span style="font-size:24px;">${emoji}</span>`;
                    if (turns !== undefined && turns > 0) {
                        html += `<div style="position:absolute; bottom:-2px; right:-2px; background:rgba(0,0,0,0.7); color:white; font-size:12px; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-weight:bold; z-index:2;">${turns}</div>`;
                    }
                    html += `</div>`;
                    return html;
                };

                if (u.poison > 0) statusHtml += renderIcon('Art/Poison.png', badStyle, 'Poisoned', u.poisonTurns);
                if (u.sleep > 0) statusHtml += renderIcon('Art/Sleep.png', badStyle, 'Sleeping', u.sleep);
                if (u.stunned > 0) statusHtml += renderIcon('Art/Stun.png', badStyle, 'Stunned', u.stunned);
                
                if (u.buffs) {
                    const regenBuff = u.buffs.find(b => b.type === 'regen' || b.type === 'regen_flat' || b.type === 'regen_pct');
                    if (regenBuff) statusHtml += renderIcon('Art/Regen.png', goodStyle, 'Regen', regenBuff.turns);
                    
                    const atkBuff = u.buffs.find(b => b.type === 'atk_buff' || b.type === 'atk_buff_pct');
                    if (atkBuff) statusHtml += renderIcon('Art/Buff DMG.png', goodStyle, 'ATK Up', atkBuff.turns);
                    
                    const spdBuff = u.buffs.find(b => b.type === 'spd_buff' || b.type === 'spd_buff_pct');
                    if (spdBuff) statusHtml += renderIcon('Art/Buff SPD.png', goodStyle, 'SPD Up', spdBuff.turns);

                    const lifestealBuff = u.buffs.find(b => b.type === 'lifesteal_buff');
                    if (lifestealBuff) statusHtml += renderEmojiIcon('❤️‍🩹', goodStyle, 'Lifesteal', lifestealBuff.turns);

                    const bramblesBuff = u.buffs.find(b => b.type === 'brambles');
                    if (bramblesBuff) statusHtml += renderEmojiIcon('🌵', goodStyle, 'Thorns', bramblesBuff.turns);

                    const counterBuff = u.buffs.find(b => b.type === 'counter');
                    if (counterBuff) statusHtml += renderEmojiIcon('⚔️', goodStyle, 'Counter', counterBuff.turns);

                    const tauntBuff = u.buffs.find(b => b.type === 'taunt');
                    if (tauntBuff) statusHtml += renderEmojiIcon('🎯', goodStyle, 'Taunt', tauntBuff.turns);
                }

                if (u.debuffs) {
                    const atkDebuff = u.debuffs.find(b => b.type === 'atk_debuff' || b.type === 'atk_debuff_pct');
                    if (atkDebuff) statusHtml += renderIcon('Art/Debuff DMG.png', badStyle, 'ATK Down', atkDebuff.turns);

                    const spdDebuff = u.debuffs.find(b => b.type === 'spd_debuff' || b.type === 'spd_debuff_pct');
                    if (spdDebuff) statusHtml += renderIcon('Art/Debuff SPD.png', badStyle, 'SPD Down', spdDebuff.turns);
                }

                if (u.defMod > 0) statusHtml += renderIcon('Art/Guard.png', goodStyle, 'Guarded');
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
                div.onmouseover = () => {
                    if (combatState.targetingMove && combatState.activeUnit && u) {
                        const dmg = calculateDamage(combatState.activeUnit, combatState.targetingMove, u);
                        // Make sure the move does damage and it targets an enemy
                        if (dmg > 0 && !(combatState.targetingMove.effect && combatState.targetingMove.effect.target === "ally")) {
                            let dmgEl = div.querySelector('.projected-damage');
                            if (!dmgEl) {
                                dmgEl = document.createElement('div');
                                dmgEl.className = 'projected-damage';
                                dmgEl.style.cssText = 'position:absolute; top:-30px; left:50%; transform:translateX(-50%); font-size:32px; font-weight:bold; color:#ff4444; z-index:50; text-shadow:2px 2px 4px black, -2px -2px 4px black, 2px -2px 4px black, -2px 2px 4px black; pointer-events:none;';
                                div.appendChild(dmgEl);
                            }
                            // Calculate hit count for total damage preview if it's a multi-hit move
                            const hitCount = combatState.targetingMove.hits || 1;
                            const totalDmg = dmg * hitCount;
                            
                            const targetTypes = Array.isArray(u.type) ? u.type : [u.type];
                            const mult = getElementMultiplier(combatState.targetingMove.t, targetTypes);
                            let arrow = '';
                            if (mult > 1) {
                                arrow = ' <span style="color:#ffcc00;">↑</span>';
                            } else if (mult < 1) {
                                arrow = ' <span style="color:#aaa;">↓</span>';
                            }
                            
                            dmgEl.innerHTML = `-${totalDmg}${arrow}`;
                        } else if (combatState.targetingMove.effect && combatState.targetingMove.effect.type.includes('heal')) {
                            let dmgEl = div.querySelector('.projected-damage');
                            if (!dmgEl) {
                                dmgEl = document.createElement('div');
                                dmgEl.className = 'projected-damage';
                                dmgEl.style.cssText = 'position:absolute; top:-30px; left:50%; transform:translateX(-50%); font-size:32px; font-weight:bold; color:#51cf66; z-index:50; text-shadow:2px 2px 4px black, -2px -2px 4px black, 2px -2px 4px black, -2px 2px 4px black; pointer-events:none;';
                                div.appendChild(dmgEl);
                            }
                            
                            const eff = combatState.targetingMove.effect;
                            let amount = 0;
                            if (eff.type === 'heal_pct') {
                                amount = Math.floor(combatState.activeUnit.hp * eff.value);
                            } else {
                                amount = eff.value || Math.floor((combatState.activeUnit.matk + combatState.activeUnit.ratk + (combatState.activeUnit.atkMod || 0)) * 1.5 * (combatState.targetingMove.p || 1.0));
                            }
                            dmgEl.innerHTML = `+${amount}`;
                        }
                    }
                };
                div.onmouseout = () => {
                    const dmgEl = div.querySelector('.projected-damage');
                    if (dmgEl) dmgEl.remove();
                };
            } else {
                div.onclick = null;
                div.onmouseover = null;
                div.onmouseout = null;
                const dmgEl = div.querySelector('.projected-damage');
                if (dmgEl) dmgEl.remove();
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
                    if (b.type === 'regen' || b.type === 'regen_flat' || b.type === 'regen_pct') {
                        const healAmount = b.type === 'regen_pct' ? Math.floor(unit.hp * b.value) : b.value;
                        unit.currentHp = Math.min(unit.hp, unit.currentHp + healAmount);
                        showFloatingText(unit, "+" + healAmount, "#51cf66");
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
                    if (d.type === 'spd_debuff' || d.type === 'spd_debuff_pct') unit.spdMod -= d.value;
                });
            }

            // Poison
            if (unit.poison > 0 && unit.poisonTurns > 0) {
                const dmg = unit.poison;
                unit.currentHp -= dmg;
                showFloatingText(unit, "-" + dmg, "#a200ff");
                unit.poisonTurns--;
                if (unit.poisonTurns <= 0) unit.poison = 0;
                
                combatLog(`${unit.name} took ${dmg} poison damage!`);
                if (unit.currentHp <= 0) {
                    combatLog(`${unit.name} fainted from poison!`);
                    calculateTurnOrder(true); // Refresh order if someone died
                    setTimeout(nextTurn, 1000);
                    return;
                }
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
            }
            currentRun.activeTurnIndex = (currentRun.activeTurnIndex + 1) % currentRun.turnOrder.length;
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
                
                // Override flex column to stack header (name/cost) and description
                btn.style.flexDirection = 'column';
                btn.style.alignItems = 'stretch';
                btn.style.justifyContent = 'center';
                btn.style.gap = '5px';

                const isTargetingThis = combatState.targetingMove === m;
                if (isTargetingThis) btn.style.background = 'gold';
                
                btn.disabled = currentEnergy < m.c;
                btn.innerHTML = `
                    <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                        <div style="display:flex; flex-direction:row; align-items:center; gap: 5px;">
                            <span style="font-weight:bold; font-size:16px;">${m.n}</span>
                            <span style="display:flex; align-items:center;">${getElementIcon(moveType) ? `<img src="${getElementIcon(moveType)}" style="width:20px; height:20px;" alt="${moveType}" />` : moveType}</span>
                        </div>
                        <span class="move-cost" style="position:static;">${m.c} EN</span>
                    </div>
                    <div style="font-size:12px; color:rgba(255,255,255,0.7); text-align:left; line-height:1.2;">
                        ${getMoveDescription(m)}
                    </div>
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
                        let tauntingEnemies = aliveEnemies.filter(e => e.buffs && e.buffs.some(b => b.type === 'taunt'));
                        let validTargets = tauntingEnemies.length > 0 ? tauntingEnemies : aliveEnemies;
                        if (move.melee && tauntingEnemies.length === 0) {
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

                        let countered = false;
                        if (t.buffs) {
                            const counterBuffIdx = t.buffs.findIndex(b => b.type === 'counter');
                            if (counterBuffIdx !== -1) {
                                countered = true;
                                const counterBuff = t.buffs[counterBuffIdx];
                                const counterDamage = Math.floor(damage * counterBuff.value);
                                t.buffs.splice(counterBuffIdx, 1); // remove counter after hit
                                attacker.currentHp -= counterDamage;
                                showFloatingText(attacker, "-" + counterDamage, "#ff4444");
                                combatLog(`${t.name} countered! ${attacker.name} took ${counterDamage} damage!`);
                                damage = 0;
                            }
                        }

                        if (!countered) {
                            t.currentHp -= damage;
                            const targetTypesList = Array.isArray(t.type) ? t.type : [t.type];
                            const dmgMult = getElementMultiplier(move.t, targetTypesList);
                            let arrow = '';
                            if (dmgMult > 1) arrow = ' <span style="color:#ffcc00; text-shadow: 2px 2px 2px #000;">↑</span>';
                            else if (dmgMult < 1) arrow = ' <span style="color:#aaa; text-shadow: 2px 2px 2px #000;">↓</span>';
                            showFloatingText(t, "-" + damage + arrow, "#ff4444");
                            combatLog(`${t.name} took ${damage} damage!`);
                        }

                        if (t.buffs) {
                            const bramblesBuffs = t.buffs.filter(b => b.type === 'brambles');
                            if (bramblesBuffs.length > 0) {
                                const reflectAmt = bramblesBuffs[0].value;
                                if (reflectAmt > 0) {
                                    attacker.currentHp -= reflectAmt;
                                    showFloatingText(attacker, "-" + reflectAmt, "#ff4444");
                                    combatLog(`${attacker.name} took ${reflectAmt} damage from Thorns!`);
                                }
                            }
                        }

                        if (attacker.buffs) {
                            const lifestealBuffs = attacker.buffs.filter(b => b.type === 'lifesteal_buff');
                            if (lifestealBuffs.length > 0) {
                                const lifestealAmt = lifestealBuffs[0].value;
                                const healAmt = Math.floor(damage * lifestealAmt);
                                if (healAmt > 0) {
                                    attacker.currentHp = Math.min(attacker.hp, attacker.currentHp + healAmt);
                                    showFloatingText(attacker, "+" + healAmt, "#51cf66");
                                    combatLog(`${attacker.name} lifestealed ${healAmt} HP!`);
                                }
                            }
                        }

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
                    function applyStatus(isDebuff, bType, bValue, bTurns) {
                        const list = isDebuff ? (t.debuffs = t.debuffs || []) : (t.buffs = t.buffs || []);
                        const existing = list.find(b => b.type === bType);
                        if (existing) {
                            existing.turns += bTurns;
                            if (bValue !== undefined) existing.value = Math.max(existing.value || 0, bValue);
                        } else {
                            list.push({ type: bType, value: bValue, turns: bTurns });
                        }
                    }
                    function recalcMods(unit) {
                        unit.atkMod = 0; unit.spdMod = 0; unit.defMod = 0;
                        if (unit.buffs) unit.buffs.forEach(b => {
                            if (b.type.includes('atk_buff')) unit.atkMod += b.value;
                            if (b.type.includes('spd_buff')) unit.spdMod += b.value;
                            if (b.type.includes('guard')) unit.defMod = b.value;
                        });
                        if (unit.debuffs) unit.debuffs.forEach(d => {
                            if (d.type.includes('atk_debuff')) unit.atkMod -= d.value;
                            if (d.type.includes('spd_debuff')) unit.spdMod -= d.value;
                        });
                    }

                    if (eff.type.includes('debuff')) {
                        applyStatus(true, eff.type, eff.value, eff.turns);
                        recalcMods(t);
                        combatLog(`${t.name}'s stats were lowered!`);
                    } else if (eff.type.includes('buff') || eff.type.includes('guard') || eff.type.includes('savage_stance') || eff.type.includes('regen') || eff.type === 'brambles' || eff.type === 'counter' || eff.type === 'taunt' || move.n === 'Ultimate Overcharge' || move.n === 'Overcharge') {
                        if (eff.type === 'savage_stance' || eff.type === 'savage_stance_pct') {
                            applyStatus(false, 'atk_buff_pct', eff.atk_value, eff.atk_turns);
                            applyStatus(false, 'guard_pct', eff.guard_value, eff.guard_turns);
                            combatLog(`${t.name} entered Savage Stance!`);
                        } else if (eff.type === 'ultimate_overcharge' || move.n === 'Ultimate Overcharge') {
                            applyStatus(false, 'atk_buff_pct', 0.2, 3);
                            applyStatus(false, 'spd_buff_pct', 0.3, 3);
                            combatLog(`${t.name} is Ultimately Overcharged!`);
                        } else {
                            const turns = move.n === 'Overcharge' ? 3 : eff.turns;
                            let appliedType = eff.type;
                            let appliedValue = eff.value;
                            if (eff.type === 'regen_pct') {
                                appliedType = 'regen';
                                appliedValue = Math.floor(attacker.hp * eff.value);
                            }
                            applyStatus(false, appliedType, appliedValue, turns);
                            if (eff.type.includes('regen')) combatLog(`${t.name} gained Health Regen!`);
                            else if (eff.type === 'lifesteal_buff') combatLog(`${t.name} gained Lifesteal!`);
                            else if (eff.type === 'brambles') combatLog(`${t.name} gained Thorns!`);
                            else if (eff.type === 'counter') combatLog(`${t.name} prepared to Counter!`);
                            else if (eff.type === 'taunt') combatLog(`${t.name} is Taunting enemies!`);
                            else combatLog(`${t.name} boosted stats!`);
                        }
                        recalcMods(t);
                    } else if (eff.type.includes('heal')) {
                        let amount = 0;
                        if (eff.type === 'heal_pct') {
                            amount = Math.floor(attacker.hp * eff.value);
                        } else {
                            amount = eff.value || Math.floor((attacker.matk + attacker.ratk + (attacker.atkMod || 0)) * 1.5 * (move.p || 1.0));
                        }
                        t.currentHp = Math.min(t.hp, t.currentHp + amount);
                        showFloatingText(t, "+" + amount, "#51cf66");
                        combatLog(`${t.name} was healed for ${amount}!`);
                    } else if (eff.type === 'stun' && Math.random() < eff.chance) {
                        t.stunned = (t.stunned || 0) + eff.turns;
                        combatLog(`${t.name} was stunned!`);
                    } else if (eff.type === 'sleep' && Math.random() < eff.chance) {
                        t.sleep = (t.sleep || 0) + eff.turns;
                        combatLog(`${t.name} fell asleep!`);
                    } else if (eff.type.includes('poison')) {
                        let poisonDmg = 0;
                        if (eff.type === 'poison_pct') {
                            poisonDmg = Math.floor(t.hp * eff.value);
                        } else {
                            poisonDmg = eff.value || 8;
                        }
                        t.poison = Math.max(t.poison || 0, poisonDmg);
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

        function getElementMultiplier(moveType, targetTypes) {
            let totalMult = 1;
            targetTypes.forEach(bt => {
                let currentMult = 1;
                if (moveType === ELEMENTS.BEAST && bt === ELEMENTS.NATURE) currentMult = 1.5;
                if (moveType === ELEMENTS.NATURE && bt === ELEMENTS.MECH) currentMult = 1.5;
                if (moveType === ELEMENTS.MECH && bt === ELEMENTS.BEAST) currentMult = 1.5;

                if (moveType === ELEMENTS.NATURE && bt === ELEMENTS.BEAST) currentMult = 0.75;
                if (moveType === ELEMENTS.MECH && bt === ELEMENTS.NATURE) currentMult = 0.75;
                if (moveType === ELEMENTS.BEAST && bt === ELEMENTS.MECH) currentMult = 0.75;
                
                totalMult *= currentMult;
            });
            return totalMult;
        }

        function calculateDamage(attacker, move, target) {
            const moveType = move.t;
            const targetTypes = Array.isArray(target.type) ? target.type : [target.type];

            let maxMult = getElementMultiplier(moveType, targetTypes);

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
            let movePower = move.p !== undefined ? move.p : 1.0;
            if (movePower === 0) return 0;
            let rawAttack = (atkStat * (1 + atkMod)) * movePower * maxMult;
            
            // Apply defMod (which is a percentage guard, e.g. 0.4 for -40% damage)
            let defMod = target.defMod || 0; // 0 means no guard, 0.4 means 40% reduction
            
            let defMultiplier = Math.max(0, 1 - (defStat / 100));
            let finalDamage = rawAttack * defMultiplier;
            finalDamage = finalDamage * (1 - defMod);

            return Math.max(1, Math.round(finalDamage));
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
                        const artHtml = `<div style="display:flex; justify-content:center; align-items:center; margin:10px 0; height:200px;">${renderArt(recruit.art, 200)}</div>`;

                        if (emptyIndex !== -1) {
                            currentRun.party[emptyIndex] = recruit;
                            // Unlock in collection
                            let text = '';
                            if (!gameState.unlockedStarters.includes(recruit.id)) {
                                gameState.unlockedStarters.push(recruit.id);
                                saveGame();
                                text = `Defeated ${recruit.name} joined your party and is now unlocked in your Collection!`;
                            } else {
                                text = `Defeated ${recruit.name} joined your party!`;
                            }
                            showGameAlert("Recruitment", text, advanceRun, artHtml);
                            return;
                        } else {
                            const mergesInParty = currentRun.party.filter(p => p && p.parents).length;
                            const nonMerges = currentRun.party.filter(p => p && !p.parents);

                            if (mergesInParty === 3 && nonMerges.length === 1) {
                                const p1 = nonMerges[0];
                                const p2 = recruit;
                                const outcome = MERGES.find(m => 
                                    (m.parents[0] === p1.id && m.parents[1] === p2.id) ||
                                    (m.parents[0] === p2.id && m.parents[1] === p1.id)
                                );

                                if (outcome) {
                                    const mergeArt = `<div style="display:flex; justify-content:center; align-items:center; margin:10px 0; gap: 10px; height:150px;">
                                        <div style="height:100%; display:flex; justify-content:center; align-items:center;">${renderArt(p1.art, 100)}</div>
                                        <span style="font-size: 24px;">+</span> 
                                        <div style="height:100%; display:flex; justify-content:center; align-items:center;">${renderArt(p2.art, 100)}</div>
                                        <span style="font-size: 24px;">=</span> 
                                        <div style="height:100%; display:flex; justify-content:center; align-items:center;">${renderArt(outcome.art, 150)}</div>
                                    </div>`;
                                    
                                    showGameConfirm(
                                        "Auto Merge Opportunity", 
                                        `You have 3 Merged monsters and 1 base monster (${p1.name}). Do you want to fuse ${p1.name} with ${p2.name} to create ${outcome.name}?`,
                                        () => {
                                            if (!gameState.unlockedStarters.includes(recruit.id)) {
                                                gameState.unlockedStarters.push(recruit.id);
                                            }
                                            if (!gameState.discoveredMerges.includes(outcome.name)) {
                                                gameState.discoveredMerges.push(outcome.name);
                                            }
                                            saveGame();
                                            
                                            const destIdx = currentRun.party.indexOf(p1);
                                            currentRun.party[destIdx] = {
                                                ...outcome,
                                                isEnemy: false,
                                                currentHp: outcome.hp,
                                                energy: outcome.startingEnergy || 0
                                            };
                                            
                                            showGameAlert("Merge Successful!", `Created ${outcome.name}!`, advanceRun, mergeArt);
                                        },
                                        () => {
                                            let replaceText = `Replace a monster with ${recruit.name}?`;
                                            if (!gameState.unlockedStarters.includes(recruit.id)) {
                                                replaceText += ` (This will also unlock it in your Collection)`;
                                            }
                                            showGameConfirm("Recruitment", replaceText, 
                                                () => openReplacementModal(recruit), 
                                                advanceRun,
                                                artHtml
                                            );
                                        },
                                        mergeArt
                                    );
                                    return;
                                }
                            }

                            let replaceText = `Your party is full. Replace a monster with ${recruit.name}?`;
                            if (!gameState.unlockedStarters.includes(recruit.id)) {
                                replaceText += ` (This will also unlock it in your Collection)`;
                            }
                            showGameConfirm("Recruitment", replaceText, 
                                () => openReplacementModal(recruit), 
                                advanceRun,
                                artHtml
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
            list.className = '';
            list.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
                    <div style="transform: scale(0.9); transform-origin: top center; margin-bottom: -40px;">
                        <div style="display: grid; grid-template-columns: 200px 200px; gap: 40px; justify-content: center; margin-bottom: 10px; color: white; font-weight: bold; text-shadow: 1px 1px 2px black;">
                            <div style="text-align: center;">BACKLINE</div>
                            <div style="text-align: center;">FRONTLINE</div>
                        </div>
                        <div style="position: relative; padding: 20px 40px; background: ${getMapBackground(currentRun.arcId)} center/cover; border-radius: 15px; border: 2px solid #444;">
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); border-radius: 15px;"></div>
                            <div class="team" style="position: relative; z-index: 2; width: auto; padding: 0; direction: rtl;" id="replace-list-team">
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const teamContainer = document.getElementById('replace-list-team');
            
            const closeBtn = document.getElementById('modal-selection-close-btn');
            closeBtn.onclick = () => {
                closeModal('modal-selection');
                advanceRun();
            };
            
            for(let idx = 0; idx < 4; idx++) {
                const m = currentRun.party[idx];
                const btn = document.createElement('div');
                btn.className = 'select-slot';
                btn.style.direction = 'ltr';
                btn.style.width = '180px';
                btn.style.height = '180px';
                
                if (!m) {
                    teamContainer.appendChild(btn);
                    continue;
                }
                
                btn.innerHTML = `
                    <div style="width:100px; height:100px; margin-bottom:5px;">
                        ${renderArt(m.art, 90)}
                    </div>
                    <strong>${m.name}</strong>
                    <div style="font-size: 0.9em; margin-top: 5px; color: #ffeb3b;">HP: ${m.currentHp} / ${m.hp}</div>
                    <button style="margin-top: 5px; width: 100%;">Replace</button>
                `;
                btn.querySelector('button').onclick = () => {
                    currentRun.party[idx] = recruit;
                    // Unlock in collection
                    if (!gameState.unlockedStarters.includes(recruit.id)) {
                        gameState.unlockedStarters.push(recruit.id);
                        saveGame();
                        setTimeout(() => {
                            showGameAlert("Recruitment", `You replaced ${m.name} with ${recruit.name}. It is now unlocked in your Collection!`, advanceRun, `<div style="display:flex; justify-content:center; align-items:center; margin:10px 0; height:200px;">${renderArt(recruit.art, 200)}</div>`);
                        }, 500);
                    } else {
                        setTimeout(() => {
                            showGameAlert("Recruitment", `You replaced ${m.name} with ${recruit.name}!`, advanceRun, `<div style="display:flex; justify-content:center; align-items:center; margin:10px 0; height:200px;">${renderArt(recruit.art, 200)}</div>`);
                        }, 500);
                    }
                    closeModal('modal-selection');
                };
                teamContainer.appendChild(btn);
            }
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
                        msg += `\nUnlocked new starter: ${STARTERS[unlocksId].name}!`;
                    } else {
                        msg += `\nYou already unlocked this Arc's starter.`;
                    }
                }
                
                // Act unlocks
                if (currentRun.arcId === 'arc1' && gameState.maxActReached < 2) {
                    gameState.maxActReached = 2;
                    msg += `\n\nUNLOCKED ACT 2: The Forest!`;
                } else if (currentRun.arcId === 'arc2' && gameState.maxActReached < 3) {
                    gameState.maxActReached = 3;
                    msg += `\n\nUNLOCKED ACT 3: The Laboratory!`;
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