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
                    poison: 0,
                    toxin: 0
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
                        poison: 0,
                        toxin: 0
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
                p.toxin = 0;
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

        async function playStatusVFX(unit, type, onImpact) {
            const targetEl = getElementForUnit(unit);
            if (!targetEl) {
                if (onImpact) onImpact();
                return;
            }
            
            const animEl = document.createElement('img');
            animEl.src = `Art/${type}_1.png`;
            animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(1.6); width:200px; height:200px; z-index:100; pointer-events:none; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));`;
            const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
            artContainer.appendChild(animEl);
            
            const maxFrames = type === 'Hemorrhage' ? 8 : 7;
            
            // Preload images to avoid flickering
            for (let i = 2; i <= maxFrames; i++) {
                const img = new Image();
                img.src = `Art/${type}_${i}.png`;
            }
            
            if (type === 'Hemorrhage') {
                animEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'forwards' });
                animEl.style.transform = 'translate(-50%, -50%) scale(0.5)';
                animEl.animate([
                    { transform: 'translate(-50%, -50%) scale(0.5)' },
                    { transform: 'translate(-50%, -50%) scale(1.6)' }
                ], { duration: 5 * 80, easing: 'ease-out', fill: 'forwards' });

                for (let i = 1; i <= 5; i++) {
                    animEl.src = `Art/${type}_${i}.png`;
                    if (i === 5 && onImpact) onImpact();
                    await new Promise(r => setTimeout(r, 80));
                }

                // Squish in and out
                const squishAnim = animEl.animate([
                    { transform: 'translate(-50%, -50%) scale(1.6)' },
                    { transform: 'translate(-50%, -50%) scale(1.2)' },
                    { transform: 'translate(-50%, -50%) scale(1.8)' },
                    { transform: 'translate(-50%, -50%) scale(1.6)' }
                ], { duration: 300, easing: 'ease-in-out' });
                await squishAnim.finished;

                for (let i = 6; i <= 8; i++) {
                    animEl.src = `Art/${type}_${i}.png`;
                    await new Promise(r => setTimeout(r, 80));
                }
                animEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
                await new Promise(r => setTimeout(r, 150));
            } else {
                animEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 100, fill: 'forwards' });
                for (let i = 1; i <= maxFrames; i++) {
                    animEl.src = `Art/${type}_${i}.png`;
                    if (i === 5 && onImpact) {
                        onImpact();
                    }
                    let delayMs = type === 'Poison' || type === 'Toxin' ? 50 : 75;
                    await new Promise(r => setTimeout(r, delayMs));
                }
                animEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
                await new Promise(r => setTimeout(r, 150));
            }
            
            if (animEl.parentNode) {
                animEl.parentNode.removeChild(animEl);
            }
        }

        function playHealVFX(unit) {
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

            const numPluses = 5;
            for (let i = 0; i < numPluses; i++) {
                setTimeout(() => {
                    const healEl = document.createElement('img');
                    healEl.src = "Art/Heal_1.png";
                    
                    const randomX = Math.random() * 80 - 40; 
                    const randomY = Math.random() * 80 - 40; 
                    
                    healEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(calc(-50% + ${randomX}px), calc(-50% + ${randomY}px)) scale(0.5); width:80px; height:80px; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 5px #51cf66);`;
                    unitEl.appendChild(healEl);
                    
                    const anim = healEl.animate([
                        { opacity: 0, transform: `translate(calc(-50% + ${randomX}px), calc(-50% + ${randomY + 30}px)) scale(0.5)` },
                        { opacity: 1, transform: `translate(calc(-50% + ${randomX}px), calc(-50% + ${randomY}px)) scale(1)` },
                        { opacity: 0, transform: `translate(calc(-50% + ${randomX}px), calc(-50% + ${randomY - 60}px)) scale(1.2)` }
                    ], { duration: 600, easing: 'ease-out', fill: 'forwards' });
                    
                    anim.onfinish = () => {
                        if (healEl && healEl.parentNode) {
                            healEl.parentNode.removeChild(healEl);
                        }
                    };
                }, i * 150);
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
            document.getElementById('energy-display').innerHTML = `<div style="display:flex; justify-content:center; align-items:center; gap:5px;"><img src="Art/EN.png" style="width:24px;height:24px;filter:drop-shadow(1px 1px 1px black);" alt="EN" /><span style="font-size:24px; font-weight:bold; color:white; text-shadow:1px 1px 2px black;">${energy}</span></div>`;
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
                obj.innerHTML = `${current}/${maxHp}`;
                obj.setAttribute('data-current-hp', current);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    obj.innerHTML = `${end}/${maxHp}`;
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
                if (u.toxin > 0) statusHtml += renderIcon('Art/Toxin.png', badStyle, 'Toxin', u.toxinTurns);
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
                    if (lifestealBuff) statusHtml += renderIcon('Art/Lifesteal.png', goodStyle, 'Lifesteal', lifestealBuff.turns);

                    const overchargeBuff = u.buffs.find(b => b.type === 'overcharge_buff');
                    if (overchargeBuff) statusHtml += renderIcon('Art/Buff Energy.png', goodStyle, 'Overcharge', overchargeBuff.turns);

                    const bramblesBuff = u.buffs.find(b => b.type === 'brambles');
                    if (bramblesBuff) statusHtml += renderIcon('Art/Thorns.png', goodStyle, 'Thorns', bramblesBuff.turns);

                    const counterBuff = u.buffs.find(b => b.type === 'counter');
                    if (counterBuff) statusHtml += renderIcon('Art/Counter.png', goodStyle, 'Counter', counterBuff.turns);

                    const tauntBuff = u.buffs.find(b => b.type === 'taunt');
                    if (tauntBuff) statusHtml += renderIcon('Art/Taunt.png', goodStyle, 'Taunt', tauntBuff.turns);
                }

                if (u.debuffs) {
                    const atkDebuff = u.debuffs.find(b => b.type === 'atk_debuff' || b.type === 'atk_debuff_pct');
                    if (atkDebuff) statusHtml += renderIcon('Art/Debuff DMG.png', badStyle, 'ATK Down', atkDebuff.turns);
                }

                if (u.defMod > 0) statusHtml += renderIcon('Art/Guard.png', goodStyle, 'Guarded');
            }

            const typeIconHtml = getTypeIconHtml(types, 40);

            const iconPosition = u.isEnemy ? 'right: -10px;' : 'left: -10px;';
            const hasTaunt = u.buffs && u.buffs.some(b => b.type === 'taunt');

            if (!div.querySelector('.hp-fill') || !div.querySelector('.hp-text')) {
                div.innerHTML = `
                    <div class="monster-art-container" style="position: relative;">
                        <div class="art-content" style="animation-delay: -${index * 0.4}s">${artHtml}</div>
                        <img src="Art/Taunt_1.png" class="taunt-circle" style="display: ${hasTaunt ? 'block' : 'none'};" />
                        <div class="shadow-ellipse"></div>
                        <div class="status-container" style="position: absolute; bottom: 0; left: 0; width: 100%; display:flex; justify-content:center; gap:4px; z-index: 10;">
                            ${statusHtml}
                        </div>
                    </div>
                    <div class="stats-container" style="position: relative; padding-top: 10px; z-index: 10;">
                        <div class="type-icon-container" style="position: absolute; top: -10px; ${iconPosition} z-index: 11;">
                            ${typeIconHtml}
                        </div>
                        <div class="name" style="text-align: center; color: white; font-weight: bold; font-size: 14px; text-shadow: 1px 1px 2px black; margin-bottom: 4px;">
                            ${u.name}
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                            <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                            <div class="hp-bar" style="flex: 1; position: relative;">
                                <div class="hp-fill" style="width:${hpPerc}%; background-color:${hpColor}; transition: width 1.5s ease-out, background-color 1.5s ease-out;"></div>
                                <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px black; pointer-events: none;" data-current-hp="${Math.ceil(u.currentHp)}">
                                    ${Math.ceil(u.currentHp)}/${u.hp}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                            <img src="Art/EN.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="EN" />
                            <div class="energy-blocks" style="display: flex; gap: 4px; flex: 1;">
                                ${[1, 2, 3].map(i => `<div style="flex: 1; height: 6px; background-color: ${u.energy >= i ? '#00a8ff' : '#222'}; border-radius: 2px; transition: background-color 0.3s ease;"></div>`).join('')}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                div.querySelector('.art-content').innerHTML = artHtml;
                
                const tauntCircle = div.querySelector('.taunt-circle');
                if (tauntCircle) tauntCircle.style.display = hasTaunt ? 'block' : 'none';

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
                    hpTextEl.innerHTML = `${targetHp}/${u.hp}`;
                }

                const energyBlocksEl = div.querySelector('.energy-blocks');
                if (energyBlocksEl) {
                    energyBlocksEl.innerHTML = [1, 2, 3].map(i => `<div style="flex: 1; height: 6px; background-color: ${u.energy >= i ? '#00a8ff' : '#222'}; border-radius: 2px; transition: background-color 0.3s ease;"></div>`).join('');
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
                        combatLog(`${unit.name} regenerated ${healAmount} HP!`);
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
                    
                    combatLog(`${unit.name} took ${dmg} poison damage!`);
                    
                    if (unit.currentHp <= 0) {
                        isDead = true;
                        combatLog(`${unit.name} fainted from poison!`);
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
                    
                    combatLog(`${unit.name} took ${dmg} toxin damage!`);
                    
                    if (unit.currentHp <= 0) {
                        isDead = true;
                        combatLog(`${unit.name} fainted from toxin!`);
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
                combatLog(`${unit.name} is stunned and skips their turn!`);
                unit.stunned--;
                unit.skipEnergyGeneration = true;
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

        function getElementForUnit(unit) {
            if (!unit) return null;
            let index;
            if (unit.isEnemy) {
                index = combatState.enemies.indexOf(unit);
                if (index !== -1) return document.getElementById('enemy-team').children[index];
            } else {
                index = currentRun.party.indexOf(unit);
                if (index !== -1) return document.getElementById('player-team').children[index];
            }
            return null;
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

            if (move.p > 0 && !move.effect?.type.includes('heal')) {
                const attackerEl = getElementForUnit(attacker);
                if (attackerEl) {
                    const dashDist = attacker.isEnemy ? '-30px' : '30px';
                    attackerEl.animate([
                        { transform: 'translateX(0)' },
                        { transform: `translateX(${dashDist})` },
                        { transform: 'translateX(0)' }
                    ], { duration: 300, easing: 'ease-in-out' });
                }
                await new Promise(r => setTimeout(r, 250));
            }

            for (const t of targets) {
                if (!t || t.currentHp <= 0) continue;

                let animDelay = 0;

                if (move.n.includes("Bite")) {
                    animDelay = 490; // 250 + 4*60
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const biteAnimEl = document.createElement('img');
                        biteAnimEl.src = "Art/Bite_1.png";
                        biteAnimEl.style.cssText = "position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:250px; height:250px; z-index:100; pointer-events:none; opacity: 0;";
                        targetEl.appendChild(biteAnimEl);
                        
                        // Play animation concurrently with the damage step
                        (async () => {
                            const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                            biteAnimEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
                            await new Promise(r => setTimeout(r, 75)); // Stay on frame 1
                            for (let frame = 2; frame <= 5; frame++) {
                                await new Promise(r => setTimeout(r, 60)); // Fast close
                                if (biteAnimEl) biteAnimEl.src = `Art/Bite_${frame}.png`;
                            }
                            
                            // Squish target when bitten
                            const bScale = t.isBoss ? 2.0 : 1.0;
                            artContainer.animate([
                                { transform: `scale(${bScale}, ${bScale})` },
                                { transform: `scale(${bScale * 1.2}, ${bScale * 0.8})` },
                                { transform: `scale(${bScale * 0.9}, ${bScale * 1.1})` },
                                { transform: `scale(${bScale}, ${bScale})` }
                            ], { duration: 300, easing: 'ease-out' });

                            // Shake
                            biteAnimEl.animate([
                                { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)' },
                                { transform: 'translate(-55%, -45%) rotate(-5deg) scale(1.05)' },
                                { transform: 'translate(-45%, -55%) rotate(5deg) scale(1.05)' },
                                { transform: 'translate(-55%, -55%) rotate(-5deg) scale(1.05)' },
                                { transform: 'translate(-45%, -45%) rotate(5deg) scale(1.05)' },
                                { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)' }
                            ], { duration: 200, easing: 'ease-in-out' });

                            await new Promise(r => setTimeout(r, 300)); // Stay closed
                            
                            const fadeOut = biteAnimEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
                            await fadeOut.finished;

                            if (targetEl && biteAnimEl.parentNode === targetEl) {
                                targetEl.removeChild(biteAnimEl);
                            }
                        })();
                    }
                }

                if (move.n.includes("Snipe")) {
                    animDelay = 450; // 150 appear + 200 stay + 100 tremble
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Snipe_1.png";
                        animEl.style.cssText = "position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(1.5); width:250px; height:250px; z-index:100; pointer-events:none; opacity: 0;";
                        targetEl.appendChild(animEl);
                        
                        // Play animation concurrently with the damage step
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: 'translate(-50%, -50%) scale(2)' }, 
                                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
                            ], { duration: 150, easing: 'ease-out', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 150));
                            
                            // Stay
                            await new Promise(r => setTimeout(r, 200));

                            // Impact flash / tremble
                            animEl.animate([
                                { transform: 'translate(-50%, -50%) scale(1)', filter: 'brightness(1) drop-shadow(0 0 0px red)' },
                                { transform: 'translate(-55%, -45%) scale(1.05)', filter: 'brightness(1.5) drop-shadow(0 0 10px red) drop-shadow(0 0 20px red)' },
                                { transform: 'translate(-45%, -55%) scale(1.05)', filter: 'brightness(1.5) drop-shadow(0 0 10px red) drop-shadow(0 0 20px red)' },
                                { transform: 'translate(-50%, -50%) scale(1)', filter: 'brightness(1) drop-shadow(0 0 0px red)' }
                            ], { duration: 100, easing: 'linear' });
                            
                            await new Promise(r => setTimeout(r, 200)); 
                            
                            const fadeOut = animEl.animate([{ opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }, { opacity: 0, transform: 'translate(-50%, -50%) scale(0.8)' }], { duration: 150, fill: 'forwards' });
                            await fadeOut.finished;

                            if (targetEl && animEl.parentNode === targetEl) {
                                targetEl.removeChild(animEl);
                            }
                        })();
                    }
                }

                if (move.n.includes("Spit") || move.n.includes("Slumber Sludge")) {
                    const animPrefix = move.n.includes("Slumber Sludge") ? "SlumberSludge" : "Spit";
                    animDelay = 300; 
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const spitAnimEl = document.createElement('img');
                        spitAnimEl.src = `Art/${animPrefix}_1.png`;
                        
                        const startX = attacker.isEnemy ? '250px' : '-250px';
                        const startY = '-250px';
                        const endX = attacker.isEnemy ? '50px' : '-50px';
                        const endY = '-50px';
                        const flip = attacker.isEnemy ? 'scaleX(-1)' : 'scaleX(1)';
                        
                        spitAnimEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(calc(-50% + ${startX}), calc(-50% + ${startY})) ${flip}; width:150px; height:150px; z-index:100; pointer-events:none; opacity: 0;`;
                        targetEl.appendChild(spitAnimEl);
                        
                        // Play animation concurrently with the damage step
                        (async () => {
                            spitAnimEl.animate([
                                { opacity: 0, transform: `translate(calc(-50% + ${startX}), calc(-50% + ${startY})) ${flip}` },
                                { opacity: 1, transform: `translate(calc(-50% + ${startX} * 0.8), calc(-50% + ${startY} * 0.8)) ${flip}`, offset: 0.2 },
                                { opacity: 1, transform: `translate(calc(-50% + ${endX}), calc(-50% + ${endY})) ${flip}` }
                            ], { duration: 300, easing: 'ease-in', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 300));
                            
                            spitAnimEl.src = `Art/${animPrefix}_2.png`;
                            spitAnimEl.style.width = "250px";
                            spitAnimEl.style.height = "250px";
                            
                            spitAnimEl.animate([
                                { transform: `translate(-50%, -50%) scale(0.5) ${flip}` },
                                { transform: `translate(-50%, -50%) scale(1.1) ${flip}` },
                                { transform: `translate(-50%, -50%) scale(1) ${flip}` }
                            ], { duration: 200, easing: 'ease-out', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 400));
                            
                            const fadeOut = spitAnimEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
                            await fadeOut.finished;

                            if (targetEl && spitAnimEl.parentNode === targetEl) {
                                targetEl.removeChild(spitAnimEl);
                            }
                        })();
                    }
                }

                if (move.n.includes("Maul")) {
                    animDelay = 250; 
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Maul_1.png";
                        
                        const flip = attacker.isEnemy ? 'scaleX(-1)' : 'scaleX(1)';
                        const startX = attacker.isEnemy ? -80 : 80;
                        const endX = attacker.isEnemy ? 80 : -80;
                        
                        animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(calc(-50% + ${startX}px), calc(-50% - 100px)) scale(1.5) ${flip}; width:250px; height:250px; z-index:100; pointer-events:none; opacity: 0;`;
                        targetEl.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: `translate(calc(-50% + ${startX}px), calc(-50% - 100px)) scale(1.5) ${flip}` },
                                { opacity: 1, transform: `translate(-50%, calc(-50% - 20px)) scale(1.2) ${flip}`, offset: 0.4 },
                                { opacity: 1, transform: `translate(calc(-50% + ${endX * 0.2}px), calc(-50%)) scale(1.2) ${flip}`, offset: 0.7 },
                                { opacity: 0, transform: `translate(calc(-50% + ${endX}px), calc(-50% + 20px)) scale(0.8) ${flip}` }
                            ], { duration: 400, easing: 'ease-out', fill: 'forwards' });
                            
                            setTimeout(() => {
                                animEl.animate([
                                    { filter: 'brightness(1) drop-shadow(0 0 0px red)' },
                                    { filter: 'brightness(1.5) drop-shadow(0 0 20px red)' },
                                    { filter: 'brightness(1) drop-shadow(0 0 0px red)' }
                                ], { duration: 150 });
                            }, 150);

                            await new Promise(r => setTimeout(r, 450));

                            if (targetEl && animEl.parentNode === targetEl) {
                                targetEl.removeChild(animEl);
                            }
                        })();
                    }
                }

                if (move.n.includes("Devour")) {
                    animDelay = 250; 
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl1 = document.createElement('img');
                        animEl1.src = "Art/Maul_1.png";
                        const animEl2 = document.createElement('img');
                        animEl2.src = "Art/Maul_1.png";
                        
                        const flip1 = attacker.isEnemy ? 'scaleX(-1)' : 'scaleX(1)';
                        const flip2 = attacker.isEnemy ? 'scaleX(1)' : 'scaleX(-1)'; // Mirrored
                        const startX1 = attacker.isEnemy ? -80 : 80;
                        const endX1 = attacker.isEnemy ? 80 : -80;
                        const startX2 = attacker.isEnemy ? 80 : -80;
                        const endX2 = attacker.isEnemy ? -80 : 80;
                                          animEl1.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(calc(-50% + ${startX1}px), calc(-50% - 100px)) scale(1.5) ${flip1}; width:250px; height:250px; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 10px #ff0000);`;
                        animEl2.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(calc(-50% + ${startX2}px), calc(-50% - 100px)) scale(1.5) ${flip2}; width:250px; height:250px; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 10px #ff0000);`;
                        
                        targetEl.appendChild(animEl1);
                        targetEl.appendChild(animEl2);
                        
                        (async () => {
                            animEl1.animate([
                                { opacity: 0, transform: `translate(calc(-50% + ${startX1}px), calc(-50% - 100px)) scale(1.5) ${flip1}` },
                                { opacity: 1, transform: `translate(-50%, calc(-50% - 20px)) scale(1.2) ${flip1}`, offset: 0.4 },
                                { opacity: 1, transform: `translate(calc(-50% + ${endX1 * 0.2}px), calc(-50%)) scale(1.2) ${flip1}`, offset: 0.7 },
                                { opacity: 0, transform: `translate(calc(-50% + ${endX1}px), calc(-50% + 20px)) scale(0.8) ${flip1}` }
                            ], { duration: 400, easing: 'ease-out', fill: 'forwards' });
                            animEl2.animate([
                                { opacity: 0, transform: `translate(calc(-50% + ${startX2}px), calc(-50% - 100px)) scale(1.5) ${flip2}` },
                                { opacity: 1, transform: `translate(-50%, calc(-50% - 20px)) scale(1.2) ${flip2}`, offset: 0.4 },
                                { opacity: 1, transform: `translate(calc(-50% + ${endX2 * 0.2}px), calc(-50%)) scale(1.2) ${flip2}`, offset: 0.7 },
                                { opacity: 0, transform: `translate(calc(-50% + ${endX2}px), calc(-50% + 20px)) scale(0.8) ${flip2}` }
                            ], { duration: 400, easing: 'ease-out', fill: 'forwards' });
                            
                            setTimeout(() => {
                                [animEl1, animEl2].forEach(el => el.animate([
                                    { filter: 'brightness(1) drop-shadow(0 0 10px #ff0000)' },
                                    { filter: 'brightness(1.5) drop-shadow(0 0 30px #ff0000)' },
                                    { filter: 'brightness(1) drop-shadow(0 0 10px #ff0000)' }
                                ], { duration: 150 }));
                            }, 150);

                            await new Promise(r => setTimeout(r, 450));
                            if (targetEl && animEl1.parentNode === targetEl) targetEl.removeChild(animEl1);
                            if (targetEl && animEl2.parentNode === targetEl) targetEl.removeChild(animEl2);
                        })();
                    }
                }

                if (move.n === "Spore" || move.n === "Giant Spore") {
                    animDelay = 500;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const mushroomEl = document.createElement('img');
                        mushroomEl.src = "Art/Spore_1.png";
                        mushroomEl.style.cssText = "position:absolute; bottom:-10px; left:50%; transform:translateX(-50%) scale(0); width:200px; height:auto; z-index:5; pointer-events:none; transform-origin: bottom center;";
                        const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                        artContainer.appendChild(mushroomEl);

                        (async () => {
                            mushroomEl.animate([
                                { transform: 'translateX(-50%) scale(0)' },
                                { transform: 'translateX(-50%) scale(0.99)' },
                                { transform: 'translateX(-50%) scale(0.9)' }
                            ], { duration: 250, easing: 'ease-out', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 250));
                            
                            mushroomEl.animate([
                                { transform: 'translateX(-50%) scale(0.9, 0.9)' },
                                { transform: 'translateX(-50%) scale(1.17, 0.63)' },
                                { transform: 'translateX(-50%) scale(0.72, 1.17)' },
                                { transform: 'translateX(-50%) scale(0.9, 0.9)' }
                            ], { duration: 300, easing: 'ease-in-out' });
                            
                            await new Promise(r => setTimeout(r, 250)); 
                            
                            for (let i=0; i<20; i++) {
                                const sporeEl = document.createElement('img');
                                sporeEl.src = "Art/Spore_2.png";
                                const startX = (Math.random() - 0.5) * 80;
                                const startY = -40 - Math.random() * 20;
                                const endX = startX + (Math.random() - 0.5) * 200;
                                const endY = -150 - Math.random() * 100;
                                
                                sporeEl.style.cssText = `position:absolute; bottom:-10px; left:50%; transform:translate(calc(-50% + ${startX}px), ${startY}px) scale(0.5); width:40px; height:40px; z-index:101; pointer-events:none; opacity:1; filter: drop-shadow(0 0 5px #51cf66);`;
                                const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                                artContainer.appendChild(sporeEl);
                                
                                const sporeAnim = sporeEl.animate([
                                    { transform: `translate(calc(-50% + ${startX}px), ${startY}px) scale(0.5)`, opacity: 1 },
                                    { transform: `translate(calc(-50% + ${endX}px), ${endY}px) scale(1.5)`, opacity: 0 }
                                ], { duration: 400 + Math.random() * 200, easing: 'ease-out', fill: 'forwards' });
                                
                                sporeAnim.finished.then(() => {
                                    if (sporeEl.parentNode) sporeEl.parentNode.removeChild(sporeEl);
                                });
                            }
                            
                            await new Promise(r => setTimeout(r, 300));
                            
                            const fadeOut = mushroomEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
                            await fadeOut.finished;
                            if (mushroomEl.parentNode) mushroomEl.parentNode.removeChild(mushroomEl);
                        })();
                    }
                }

                
                if (move.n.includes("Root Crush")) {
                    animDelay = 450;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/RootCrush_1.png";
                        animEl.style.cssText = "position:absolute; bottom:-30px; left:50%; transform:translate(-50%, 0); width:320px; height:auto; z-index:100; pointer-events:none; opacity: 1;";
                        const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                        artContainer.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'forwards' });
                            for (let frame = 1; frame <= 6; frame++) {
                                if (animEl) animEl.src = `Art/RootCrush_${frame}.png`;
                                await new Promise(r => setTimeout(r, 60));
                            }
                            
                            const bScale = t.isBoss ? 2.0 : 1.0;
                            artContainer.animate([
                                { transform: `scale(${bScale}, ${bScale})` },
                                { transform: `scale(${bScale * 1.1}, ${bScale * 0.9})` },
                                { transform: `scale(${bScale * 0.95}, ${bScale * 1.05})` },
                                { transform: `scale(${bScale}, ${bScale})` }
                            ], { duration: 250, easing: 'ease-out' });
                            
                            animEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
                            await new Promise(r => setTimeout(r, 150));
                            if (animEl.parentNode) animEl.parentNode.removeChild(animEl);
                        })();
                    }
                }

                if (move.n.includes("Slam")) {
                    animDelay = 350;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Slam_1.png";
                        animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(1.1); width:150px; height:auto; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));`;
                        const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                        artContainer.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: `translate(-50%, -250px) scale(1.1)` },
                                { opacity: 1, transform: `translate(-50%, -150px) scale(1.1)` },
                                { opacity: 1, transform: `translate(-50%, -20%) scale(1.1)` }
                            ], { duration: 350, easing: 'ease-in', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 350));
                            
                            const bScale = t.isBoss ? 2.0 : 1.0;
                            artContainer.animate([
                                { transform: `translate(0, 0) scale(${bScale}, ${bScale})` },
                                { transform: `translate(0, 20px) scale(${bScale * 1.2}, ${bScale * 0.7})` },
                                { transform: `translate(0, -5px) scale(${bScale * 0.9}, ${bScale * 1.1})` },
                                { transform: `translate(0, 0) scale(${bScale}, ${bScale})` }
                            ], { duration: 300, easing: 'ease-out' });
                            
                            await new Promise(r => setTimeout(r, 300));
                            
                            const fadeOut = animEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, delay: 200, fill: 'forwards' });
                            await fadeOut.finished;
                            
                            if (animEl.parentNode) animEl.parentNode.removeChild(animEl);
                        })();
                    }
                }

                if (move.n.includes("Punch")) {
                    animDelay = 250;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Punch_1.png";
                        const flip = attacker.isEnemy ? 'scaleX(-1)' : 'scaleX(1)';
                        const startX = attacker.isEnemy ? '150px' : '-150px';
                        const endX = attacker.isEnemy ? '50px' : '-50px';
                        
                        animEl.style.cssText = `position:absolute; top:65%; left:50%; transform:translate(calc(-50% + ${startX}), -50%) ${flip} scale(1.0); width:150px; height:auto; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));`;
                        const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                        artContainer.appendChild(animEl);
                        
                        (async () => {
                            const punchAnim = animEl.animate([
                                { opacity: 0, transform: `translate(calc(-50% + ${startX}), -50%) ${flip} scale(0.8)` },
                                { opacity: 1, transform: `translate(calc(-50% + ${endX}), -50%) ${flip} scale(1.2)` }
                            ], { duration: 250, easing: 'ease-in', fill: 'forwards' });

                            await punchAnim.finished;

                            animEl.animate([
                                { opacity: 1, transform: `translate(calc(-50% + ${endX}), -50%) ${flip} scale(1.2)` },
                                { opacity: 0, transform: `translate(calc(-50% + ${endX}), -50%) ${flip} scale(1.3)` }
                            ], { duration: 500, delay: 300, fill: 'forwards' });

                            const bScale = t.isBoss ? 'scale(2.0, 2.0)' : 'scale(1.0, 1.0)';
                            artContainer.animate([
                                { transform: `translate(0, 0) ${bScale}`, offset: 0 },
                                { transform: `translate(${attacker.isEnemy ? '-20px' : '20px'}, 0) ${bScale}`, offset: 0.15 },
                                { transform: `translate(${attacker.isEnemy ? '-90px' : '90px'}, 0) ${bScale}`, offset: 0.5 },
                                { transform: `translate(0, 0) ${bScale}`, offset: 1 }
                            ], { duration: 1000, easing: 'ease-in-out' });

                            await new Promise(r => setTimeout(r, 1000));

                            if (animEl.parentNode) animEl.parentNode.removeChild(animEl);
                        })();
                    }
                }

                if (move.n.includes("Echo")) {
                    animDelay = 450;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Echo_1.png";
                        const flip = attacker.isEnemy ? 'scaleX(-1)' : 'scaleX(1)';
                        const startX = attacker.isEnemy ? '90px' : '-90px';
                        
                        animEl.style.cssText = `position:absolute; top:65%; left:50%; transform:translate(calc(-50% + ${startX}), -50%) ${flip} scale(1.0); width:150px; height:auto; z-index:100; pointer-events:none; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));`;
                        const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                        artContainer.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: `translate(calc(-50% + ${startX}), -50%) ${flip} scale(0.8)` },
                                { opacity: 1, transform: `translate(calc(-50% + ${startX}), -50%) ${flip} scale(1.1)` },
                                { opacity: 1, transform: `translate(calc(-50% + ${startX}), -50%) ${flip} scale(1.0)` }
                            ], { duration: 200, easing: 'ease-out', fill: 'forwards' });

                            for (let i = 1; i <= 7; i++) {
                                animEl.src = `Art/Echo_${i}.png`;
                                if (i >= 4) {
                                    artContainer.animate([
                                        { filter: 'brightness(1)', transform: 'scale(1)' },
                                        { filter: 'brightness(1.5) drop-shadow(0 0 10px #ffea00)', transform: 'scale(1.05)' },
                                        { filter: 'brightness(1)', transform: 'scale(1)' }
                                    ], { duration: 100 });
                                }
                                await new Promise(r => setTimeout(r, i === 3 ? 150 : 50)); // hold briefly before blast
                            }
                            animEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
                            await new Promise(r => setTimeout(r, 150));
                            if (animEl.parentNode) animEl.parentNode.removeChild(animEl);
                        })();
                    }
                }

                if (move.n.includes("Hemorrhage")) {
                    animDelay = 800;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Hemorrhage_1.png";
                        animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(0.5); width:200px; height:200px; z-index:100; pointer-events:none; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));`;
                        const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                        artContainer.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { transform: 'translate(-50%, -50%) scale(0.5)' },
                                { transform: 'translate(-50%, -50%) scale(1.6)' }
                            ], { duration: 5 * 80, easing: 'ease-out', fill: 'forwards' });

                            for (let i = 1; i <= 5; i++) {
                                animEl.src = `Art/Hemorrhage_${i}.png`;
                                await new Promise(r => setTimeout(r, 80));
                            }
                            
                            const squishAnim = animEl.animate([
                                { transform: 'translate(-50%, -50%) scale(1.6)' },
                                { transform: 'translate(-50%, -50%) scale(1.2)' },
                                { transform: 'translate(-50%, -50%) scale(1.8)' },
                                { transform: 'translate(-50%, -50%) scale(1.6)' }
                            ], { duration: 300, easing: 'ease-in-out' });
                            await squishAnim.finished;
                            
                            for (let i = 6; i <= 8; i++) {
                                animEl.src = `Art/Hemorrhage_${i}.png`;
                                await new Promise(r => setTimeout(r, 80));
                            }
                            if (animEl.parentNode) animEl.parentNode.removeChild(animEl);
                        })();
                    }
                }

                if (move.n.includes("Stun Bolt")) {
                    animDelay = 450;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/StunBolt_1.png";
                        animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(0.2); width:340px; height:340px; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 20px #00a8ff) brightness(1.2);`;
                        targetEl.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: `translate(-50%, -50%) scale(0.2)` },
                                { opacity: 1, transform: `translate(-50%, -50%) scale(1.0)` },
                                { opacity: 1, transform: `translate(-50%, -50%) scale(0.85)` }
                            ], { duration: 150, easing: 'ease-out', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 150));
                            
                            await new Promise(r => setTimeout(r, 200));

                            animEl.animate([
                                { filter: 'drop-shadow(0 0 20px #00a8ff) brightness(1.2)' },
                                { filter: 'drop-shadow(0 0 40px #fff) brightness(2.0)' },
                                { filter: 'drop-shadow(0 0 20px #00a8ff) brightness(1.2)' }
                            ], { duration: 100 });
                            
                            targetEl.animate([
                                { transform: 'translate(2px, 2px) rotate(0deg)' },
                                { transform: 'translate(-2px, -2px) rotate(-1deg)' },
                                { transform: 'translate(-3px, 0px) rotate(1deg)' },
                                { transform: 'translate(3px, 2px) rotate(0deg)' },
                                { transform: 'translate(1px, -1px) rotate(1deg)' },
                                { transform: 'translate(-1px, 2px) rotate(-1deg)' },
                                { transform: 'translate(-3px, 1px) rotate(0deg)' },
                                { transform: 'translate(0px, 0px) rotate(0deg)' }
                            ], { duration: 250, easing: 'linear' });

                            await new Promise(r => setTimeout(r, 200));

                            const fadeOut = animEl.animate([{ opacity: 1, transform: 'translate(-50%, -50%) scale(0.85)' }, { opacity: 0, transform: 'translate(-50%, -50%) scale(0.6)' }], { duration: 150, fill: 'forwards' });
                            await fadeOut.finished;

                            if (targetEl && animEl.parentNode === targetEl) {
                                targetEl.removeChild(animEl);
                            }
                        })();
                    }
                }

                if (move.n.includes("Bulletstorm")) {
                    animDelay = 150; 
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        (async () => {
                            for (let i=0; i<3; i++) {
                                const animEl = document.createElement('img');
                                animEl.src = "Art/Snipe_1.png";
                                const offsetX = (Math.random() - 0.5) * 80;
                                const offsetY = (Math.random() - 0.5) * 80;
                                animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(0.8); width:150px; height:150px; z-index:100; pointer-events:none; opacity: 0;`;
                                targetEl.appendChild(animEl);
                                
                                animEl.animate([
                                    { opacity: 0, transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(1.5)` }, 
                                    { opacity: 1, transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(0.8)` }
                                ], { duration: 150, easing: 'ease-out', fill: 'forwards' });
                                
                                setTimeout(() => {
                                    animEl.animate([
                                        { transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(0.8)`, filter: 'brightness(1) drop-shadow(0 0 0px red)' },
                                        { transform: `translate(calc(-50% + ${offsetX - 5}px), calc(-50% + ${offsetY + 5}px)) scale(0.9)`, filter: 'brightness(1.5) drop-shadow(0 0 10px red)' },
                                        { transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(0.8)`, filter: 'brightness(1) drop-shadow(0 0 0px red)' }
                                    ], { duration: 100, easing: 'linear' });
                                }, 150);

                                setTimeout(() => {
                                    const fadeOut = animEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, delay: 200, fill: 'forwards' });
                                    fadeOut.finished.then(() => {
                                        if (targetEl && animEl.parentNode === targetEl) targetEl.removeChild(animEl);
                                    });
                                }, 350);
                                
                                await new Promise(r => setTimeout(r, 400));
                            }
                        })();
                    }
                }

                if (move.n.includes("Zap")) {
                    animDelay = 450;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Zap_1.png";
                        animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(0.2); width:260px; height:260px; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 20px #00a8ff) brightness(1.2);`;
                        targetEl.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: `translate(-50%, -50%) scale(0.2)` },
                                { opacity: 1, transform: `translate(-50%, -50%) scale(1.0)` },
                                { opacity: 1, transform: `translate(-50%, -50%) scale(0.8)` }
                            ], { duration: 150, easing: 'ease-out', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 150));
                            
                            await new Promise(r => setTimeout(r, 200));

                            animEl.animate([
                                { filter: 'drop-shadow(0 0 20px #00a8ff) brightness(1.2)' },
                                { filter: 'drop-shadow(0 0 40px #fff) brightness(2.0)' },
                                { filter: 'drop-shadow(0 0 20px #00a8ff) brightness(1.2)' }
                            ], { duration: 100 });
                            
                            // Flinch animation
                            targetEl.animate([
                                { transform: 'translate(4px, 4px) rotate(2deg) scale(0.95)' },
                                { transform: 'translate(-4px, -2px) rotate(-2deg) scale(0.95)' },
                                { transform: 'translate(-6px, 2px) rotate(1deg) scale(0.95)' },
                                { transform: 'translate(4px, -2px) rotate(-1deg) scale(0.95)' },
                                { transform: 'translate(2px, 3px) rotate(2deg) scale(0.95)' },
                                { transform: 'translate(-2px, -3px) rotate(-2deg) scale(0.95)' },
                                { transform: 'translate(0px, 0px) rotate(0deg) scale(1)' }
                            ], { duration: 300, easing: 'linear' });

                            await new Promise(r => setTimeout(r, 200));

                            const fadeOut = animEl.animate([{ opacity: 1, transform: 'translate(-50%, -50%) scale(0.8)' }, { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' }], { duration: 150, fill: 'forwards' });
                            await fadeOut.finished;

                            if (targetEl && animEl.parentNode === targetEl) {
                                targetEl.removeChild(animEl);
                            }
                        })();
                    }
                }

                if (move.n.includes("Shockwave")) {
                    animDelay = 450;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Shockwave_1.png";
                        animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(0.2); width:260px; height:260px; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 20px #ffea00) brightness(1.2);`;
                        targetEl.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: `translate(-50%, -50%) scale(0.2)` },
                                { opacity: 1, transform: `translate(-50%, -50%) scale(1.0)` },
                                { opacity: 1, transform: `translate(-50%, -50%) scale(0.8)` }
                            ], { duration: 150, easing: 'ease-out', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 150));
                            
                            await new Promise(r => setTimeout(r, 200));

                            animEl.animate([
                                { filter: 'drop-shadow(0 0 20px #ffea00) brightness(1.2)' },
                                { filter: 'drop-shadow(0 0 40px #fff) brightness(2.0)' },
                                { filter: 'drop-shadow(0 0 20px #ffea00) brightness(1.2)' }
                            ], { duration: 100 });
                            
                            // Flinch animation
                            targetEl.animate([
                                { transform: 'translate(4px, 4px) rotate(2deg) scale(0.95)' },
                                { transform: 'translate(-4px, -2px) rotate(-2deg) scale(0.95)' },
                                { transform: 'translate(-6px, 2px) rotate(1deg) scale(0.95)' },
                                { transform: 'translate(4px, -2px) rotate(-1deg) scale(0.95)' },
                                { transform: 'translate(2px, 3px) rotate(2deg) scale(0.95)' },
                                { transform: 'translate(-2px, -3px) rotate(-2deg) scale(0.95)' },
                                { transform: 'translate(0px, 0px) rotate(0deg) scale(1)' }
                            ], { duration: 300, easing: 'linear' });

                            await new Promise(r => setTimeout(r, 200));

                            const fadeOut = animEl.animate([{ opacity: 1, transform: 'translate(-50%, -50%) scale(0.8)' }, { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' }], { duration: 150, fill: 'forwards' });
                            await fadeOut.finished;

                            if (targetEl && animEl.parentNode === targetEl) {
                                targetEl.removeChild(animEl);
                            }
                        })();
                    }
                }

                const isBuff = move.n.includes("Howl") || move.n.includes("Guard") || move.n.includes("Renewal Spores") || move.n.includes("Full Throttle") || move.n.includes("Overcharge") || move.n.includes("Savage Stance") || move.n.includes("Lifesteal") || move.n.includes("Thorns") || move.n.includes("Counter");
                const isDebuff = move.n.includes("Intimidate") || move.n.includes("Poison Cloud") || move.n.includes("Toxin");

                if (isBuff) {
                    animDelay = Math.max(animDelay, 300);
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Buff_1.png";
                        animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(1); width:165px; height:165px; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 10px #51cf66);`;
                        targetEl.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: `translate(-50%, -20%) scale(0.5)` },
                                { opacity: 1, transform: `translate(-50%, -50%) scale(1.2)` },
                                { opacity: 0, transform: `translate(-50%, -80%) scale(1.5)` }
                            ], { duration: 600, easing: 'ease-out', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 650));
                            if (targetEl && animEl.parentNode === targetEl) {
                                targetEl.removeChild(animEl);
                            }
                        })();
                    }
                }

                if (isDebuff) {
                    animDelay = Math.max(animDelay, 300);
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Debuff_1.png";
                        animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(1); width:165px; height:165px; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 10px #ff4444);`;
                        targetEl.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: `translate(-50%, -80%) scale(1.5)` },
                                { opacity: 1, transform: `translate(-50%, -50%) scale(1.2)` },
                                { opacity: 0, transform: `translate(-50%, -20%) scale(0.5)` }
                            ], { duration: 600, easing: 'ease-in', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 650));
                            if (targetEl && animEl.parentNode === targetEl) {
                                targetEl.removeChild(animEl);
                            }
                        })();
                    }
                }

                if (animDelay > 0) {
                    await new Promise(r => setTimeout(r, animDelay));
                }

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
                                if (attacker.currentHp <= 0) {
                                    if (attacker.isEnemy && !combatState.firstKilledEnemy) combatState.firstKilledEnemy = attacker;
                                    else if (!attacker.isEnemy) { combatLog(`${attacker.name} has fallen!`); calculateTurnOrder(true); }
                                }
                                const attackerEl = getElementForUnit(attacker);
                                if (attackerEl) {
                                    attackerEl.animate([
                                        { transform: 'translateX(0)' },
                                        { transform: 'translateX(-5px)' },
                                        { transform: 'translateX(5px)' },
                                        { transform: 'translateX(-5px)' },
                                        { transform: 'translateX(0)' }
                                    ], { duration: 300, easing: 'ease-in-out' });
                                }
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

                            const targetEl = getElementForUnit(t);
                            if (targetEl) {
                                const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                                const baseScale = t.isBoss ? 2.0 : 1.0;
                                artContainer.animate([
                                    { transform: `scale(${baseScale}, ${baseScale})` },
                                    { transform: `scale(${baseScale * 1.2}, ${baseScale * 0.8})` },
                                    { transform: `scale(${baseScale * 0.9}, ${baseScale * 1.1})` },
                                    { transform: `scale(${baseScale}, ${baseScale})` }
                                ], { duration: 300, easing: 'ease-out' });
                            }
                        }

                        if (t.buffs) {
                            const bramblesBuffs = t.buffs.filter(b => b.type === 'brambles');
                            if (bramblesBuffs.length > 0) {
                                const reflectAmt = bramblesBuffs[0].value;
                                if (reflectAmt > 0) {
                                    attacker.currentHp -= reflectAmt;
                                    showFloatingText(attacker, "-" + reflectAmt, "#ff4444");
                                    combatLog(`${attacker.name} took ${reflectAmt} damage from Thorns!`);
                                    if (attacker.currentHp <= 0) {
                                        if (attacker.isEnemy && !combatState.firstKilledEnemy) combatState.firstKilledEnemy = attacker;
                                        else if (!attacker.isEnemy) { combatLog(`${attacker.name} has fallen!`); calculateTurnOrder(true); }
                                    }
                                    const attackerEl = getElementForUnit(attacker);
                                    if (attackerEl) {
                                        attackerEl.animate([
                                            { transform: 'translateX(0)' },
                                            { transform: 'translateX(-5px)' },
                                            { transform: 'translateX(5px)' },
                                            { transform: 'translateX(-5px)' },
                                            { transform: 'translateX(0)' }
                                        ], { duration: 300, easing: 'ease-in-out' });
                                    }
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
                                    playHealVFX(attacker);
                                    combatLog(`${attacker.name} lifestealed ${healAmt} HP!`);
                                }
                            }

                            const overchargeBuffs = attacker.buffs.filter(b => b.type === 'overcharge_buff');
                            if (overchargeBuffs.length > 0) {
                                const chance = overchargeBuffs[0].value || 0.2;
                                if (Math.random() < chance) {
                                    attacker.energy = Math.min(3, attacker.energy + 1);
                                    showFloatingText(attacker, "+1 EN", "#00a8ff");
                                    combatLog(`${attacker.name} gained bonus energy from Overcharge!`);
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
                            if (bType === 'taunt' || bType === 'counter') {
                                existing.turns = Math.max(existing.turns, bTurns);
                            } else {
                                existing.turns += bTurns;
                            }
                            existing.isNew = true;
                            if (bValue !== undefined) existing.value = Math.max(existing.value || 0, bValue);
                        } else {
                            list.push({ type: bType, value: bValue, turns: bTurns, isNew: true });
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
                        } else if (eff.type === 'overcharge_buff') {
                            applyStatus(false, 'overcharge_buff', eff.value || 0.2, eff.turns || 3);
                            combatLog(`${t.name} is Overcharged!`);
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
                        playHealVFX(t);
                        combatLog(`${t.name} was healed for ${amount}!`);
                    } else if (eff.type === 'stun' && Math.random() < eff.chance) {
                        t.stunned = (t.stunned || 0) + eff.turns;
                        combatLog(`${t.name} was stunned!`);
                    } else if (eff.type === 'sleep' && Math.random() < eff.chance) {
                        t.sleep = (t.sleep || 0) + eff.turns;
                        combatLog(`${t.name} fell asleep!`);
                        
                        if (move.n === "Spore" || move.n === "Giant Spore" || move.n === "Slumber Sludge") {
                            applyStatus(true, 'atk_debuff_pct', 0.2, eff.turns);
                            recalcMods(t);
                            combatLog(`${t.name}'s ATK was lowered by sleep!`);
                        }
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
                    } else if (eff.type.includes('toxin')) {
                        let toxinDmg = 0;
                        if (eff.type === 'toxin_pct') {
                            toxinDmg = Math.floor(t.hp * eff.value);
                        } else {
                            toxinDmg = eff.value || 8;
                        }
                        t.toxin = Math.max(t.toxin || 0, toxinDmg);
                        t.toxinTurns = eff.turns;
                        combatLog(`${t.name} was inflicted with Toxin!`);
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
            let tier = 0;
            targetTypes.forEach(bt => {
                if (moveType === ELEMENTS.BEAST && bt === ELEMENTS.NATURE) tier += 1;
                if (moveType === ELEMENTS.NATURE && bt === ELEMENTS.MECH) tier += 1;
                if (moveType === ELEMENTS.MECH && bt === ELEMENTS.BEAST) tier += 1;
                if (moveType === ELEMENTS.NATURE && bt === ELEMENTS.BEAST) tier -= 1;
                if (moveType === ELEMENTS.MECH && bt === ELEMENTS.NATURE) tier -= 1;
                if (moveType === ELEMENTS.BEAST && bt === ELEMENTS.MECH) tier -= 1;
            });
            if (tier > 0) return 1.5;
            if (tier < 0) return 0.75;
            return 1.0;
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