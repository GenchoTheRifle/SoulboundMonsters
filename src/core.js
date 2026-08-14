// --- CORE LOGIC ---
        function scaleGame() {
            const container = document.getElementById('game-container');
            const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
            container.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }

        window.addEventListener('resize', scaleGame);

        async function init() {
            scaleGame();
            try {
                const response = await fetch('data.json');
                const data = await response.json();
                ELEMENTS = data.ELEMENTS;
                STARTERS = data.STARTERS;
                MERGES = data.MERGES;
                BOSSES = data.BOSSES;

                // Preload all VFX frames to prevent lag and frame skipping
                const vfx = [
                    { prefix: 'Poison', frames: 7 },
                    { prefix: 'Toxin', frames: 7 },
                    { prefix: 'Hemorrhage', frames: 8 },
                    { prefix: 'RootCrush', frames: 6 },
                    { prefix: 'Echo', frames: 7 },
                    { prefix: 'Bite', frames: 5 },
                    { prefix: 'Spore', frames: 2 },
                    { prefix: 'Spit', frames: 2 },
                    { prefix: 'SlumberSludge', frames: 2 },
                    { prefix: 'Slam', frames: 1 },
                    { prefix: 'Punch', frames: 1 },
                    { prefix: 'StunBolt', frames: 1 },
                    { prefix: 'Snipe', frames: 1 },
                    { prefix: 'Zap', frames: 1 },
                    { prefix: 'Shockwave', frames: 1 },
                    { prefix: 'Buff', frames: 1 },
                    { prefix: 'Debuff', frames: 1 },
                    { prefix: 'Heal', frames: 1 },
                    { prefix: 'Maul', frames: 1 },
                    { prefix: 'Taunt', frames: 1 }
                ];
                Promise.all(vfx.flatMap(v => Array.from({length: v.frames}, (_, i) => new Promise(res => {
                    const img = new Image();
                    img.onload = img.onerror = res;
                    img.src = `Art/${v.prefix}_${i + 1}.png`;
                }))));

                function getMonsterType(id) {
                    const starter = STARTERS[id];
                    if (starter) return Array.isArray(starter.type) ? starter.type : [starter.type];
                    
                    const merge = MERGES.find(m => m.name.toLowerCase().replace(' ', '') === id || m.id === id);
                    if (merge) {
                        if (merge.type) return Array.isArray(merge.type) ? merge.type : [merge.type];
                        const p1Types = getMonsterType(merge.parents[0]);
                        const p2Types = getMonsterType(merge.parents[1]);
                        const types = [...new Set([...p1Types, ...p2Types])];
                        merge.type = types;
                        return types;
                    }
                    return [];
                }

                MERGES.forEach(m => {
                    m.id = m.name.toLowerCase().replace(' ', '');
                    m.type = getMonsterType(m.id);
                });
            } catch (e) {
                console.error("Failed to load game data", e);
            }

            // Temporary check to reset your progress so you can test the first-time choice
            if (!localStorage.getItem('firstTimeChoiceReset')) {
                localStorage.removeItem('soulbound_save');
                localStorage.removeItem('labborn_save');
                localStorage.setItem('firstTimeChoiceReset', 'true');
                console.log("Wiped save data for testing choice start!");
            }

            const saved = localStorage.getItem('soulbound_save') || localStorage.getItem('labborn_save');
            if (saved) {
                gameState = JSON.parse(saved);
                if (!gameState.maxActReached) {
                    gameState.maxActReached = 1;
                }
            }
            showScreen('screen-title');
        }

        function saveGame() {
            localStorage.setItem('soulbound_save', JSON.stringify(gameState));
        }

        function showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(screenId).classList.add('active');
            
            if (screenId === 'screen-selection') {
                selectionSlots = [null, null, null, null];
                updateSelectionUI();
            } else if (screenId === 'screen-arcs') {
                updateArcsUI();
            }
        }

        function updateArcsUI() {
            const currentMax = gameState.maxActReached || 1;
            const btn2 = document.getElementById('btn-arc2');
            const btn3 = document.getElementById('btn-arc3');
            const lock2 = document.getElementById('lock-overlay-2');
            const lock3 = document.getElementById('lock-overlay-3');
            
            if (currentMax < 2) {
                btn2.style.pointerEvents = 'none';
                document.getElementById('text-arc2').innerText = 'LOCKED';
                if(lock2) lock2.style.display = 'flex';
            } else {
                btn2.style.pointerEvents = 'auto';
                document.getElementById('text-arc2').innerText = 'ACT 2';
                if(lock2) lock2.style.display = 'none';
            }

            if (currentMax < 3) {
                btn3.style.pointerEvents = 'none';
                document.getElementById('text-arc3').innerText = 'LOCKED';
                if(lock3) lock3.style.display = 'flex';
            } else {
                btn3.style.pointerEvents = 'auto';
                document.getElementById('text-arc3').innerText = 'ACT 3';
                if(lock3) lock3.style.display = 'none';
            }
        }

        function getElementIcon(type) {
            if (type === 'Nature') return 'Art/Nature.png';
            if (type === 'Mech') return 'Art/Mech.png';
            if (type === 'Beast') return 'Art/Beast.png';
            return '';
        }

        function getTypeIconHtml(types, size = 32) {
            types = (Array.isArray(types) ? types : [types]).filter(Boolean);
            if (types.length === 2) {
                if (types.includes('Beast') && types.includes('Mech')) return `<img src="Art/BeastMech.png" style="width:${size}px; height:${size}px; vertical-align:middle; pointer-events:none;" title="Beast/Mech" />`;
                if (types.includes('Mech') && types.includes('Nature')) return `<img src="Art/MechNature.png" style="width:${size}px; height:${size}px; vertical-align:middle; pointer-events:none;" title="Mech/Nature" />`;
                if (types.includes('Nature') && types.includes('Beast')) return `<img src="Art/NatureBeast.png" style="width:${size}px; height:${size}px; vertical-align:middle; pointer-events:none;" title="Nature/Beast" />`;
            } else if (types.length === 1) {
                const icon = getElementIcon(types[0]);
                if (icon) return `<img src="${icon}" style="width:${size}px; height:${size}px; vertical-align:middle; pointer-events:none;" title="${types[0]}" />`;
            }
            return types.map(t => `<span style="font-size:10px; pointer-events:none;">${t}</span>`).join('');
        }

        function getMiniHpEnergyHtml(m) {
            const maxHp = m.hp;
            const curHp = m.currentHp !== undefined ? m.currentHp : maxHp;
            const hpPerc = Math.max(0, Math.min(100, (curHp / maxHp) * 100));
            const hpColor = hpPerc > 50 ? '#22c55e' : hpPerc > 25 ? '#eab308' : '#ef4444';
            const energy = m.energy !== undefined ? m.energy : (m.startingEnergy !== undefined ? m.startingEnergy : 1);
            const energyPips = m.isBoss ? [1, 2, 3, 4, 5] : [1, 2, 3];
            return `
                <div style="display:flex; flex-direction:column; width:100%; pointer-events:none;">
                    <div style="display:flex; align-items:center; gap:4px; margin-bottom:4px;">
                        <img src="Art/HP.png" style="width:16px; height:16px; filter:drop-shadow(1px 1px 1px black);" alt="HP" />
                        <div class="hp-bar" style="flex:1; position:relative; width:100%; height:13px; background:#222; border-radius:4px; overflow:hidden;">
                            <div class="hp-fill" style="height:100%; width:${hpPerc}%; background-color:${hpColor};"></div>
                            <div class="hp-text move-description-text" style="position:absolute; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; color:white; font-size:12px;">
                                ${Math.ceil(curHp)}/${maxHp}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <img src="Art/EN.png" style="width:16px; height:16px; filter:drop-shadow(1px 1px 1px black);" alt="EN" />
                        <div class="energy-blocks" style="display:flex; gap:3px; flex:1;">
                            ${energyPips.map(i => `<div style="flex:1; height:5px; background-color:${energy >= i ? '#00a8ff' : '#222'}; border-radius:2px;"></div>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        const MOVE_DESC_ICON_HP = `<img src="Art/HP.png" alt="HP" style="width:1em; height:1em; vertical-align:middle; margin:0 1px;">`;
        const MOVE_DESC_ICON_EN = `<img src="Art/EN.png" alt="EN" style="width:1em; height:1em; vertical-align:middle; margin:0 1px;">`;

        function moveDescPos(text) {
            return `<span style="color:#22c55e; font-weight:600;">${text}</span>`;
        }

        function moveDescNeg(text) {
            return `<span style="color:#ef4444; font-weight:600;">${text}</span>`;
        }

        function moveDescPluralTurns(n) {
            return n === 1 ? 'turn' : 'turns';
        }

        function moveDescPossessive(str) {
            return str.endsWith('s') ? `${str}'` : `${str}'s`;
        }

        function getMoveDescription(m) {
            let effectSentence = '';

            if (m.effect) {
                const eff = m.effect;
                const turnsWord = moveDescPluralTurns(eff.turns);

                // Whether the "Deals damage to ..." prefix already establishes this same target,
                // making a repeated mention inside the effect sentence redundant.
                const isAoEDamage = m.p > 0 && eff.target === 'all_enemies';
                const isSingleEnemyDamage = m.p > 0 && eff.target === 'enemy';

                let targetPhrase = null;
                if (eff.target === 'all_enemies' && !isAoEDamage) targetPhrase = 'all enemies';
                else if (eff.target === 'enemy' && !isSingleEnemyDamage) targetPhrase = 'an enemy';
                else if (eff.target === 'all_allies') targetPhrase = 'all allies';
                else if (eff.target === 'ally') targetPhrase = 'an ally';
                // eff.target === 'self' (or redundant) intentionally leaves targetPhrase null

                if (eff.type === 'atk_buff_pct') {
                    const who = targetPhrase ? `${moveDescPossessive(targetPhrase)} ` : '';
                    effectSentence = `Increases ${who}damage by ${moveDescPos(eff.value * 100 + '%')} for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'atk_debuff_pct') {
                    const who = moveDescPossessive(targetPhrase || 'the target');
                    effectSentence = `Decreases ${who} damage by ${moveDescNeg(eff.value * 100 + '%')} for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'spd_buff_pct') {
                    const who = targetPhrase ? `${moveDescPossessive(targetPhrase)} ` : '';
                    effectSentence = `Increases ${who}speed by ${moveDescPos(eff.value * 100 + '%')} for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'spd_debuff_pct') {
                    const who = moveDescPossessive(targetPhrase || 'the target');
                    effectSentence = `Decreases ${who} speed by ${moveDescNeg(eff.value * 100 + '%')} for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'guard_pct') {
                    effectSentence = `Reduces incoming damage by ${moveDescPos(eff.value * 100 + '%')} until hit.`;
                } else if (eff.type === 'heal_flat') {
                    const who = targetPhrase || 'the target';
                    effectSentence = `Heals ${who} for ${moveDescPos(eff.value)} ${MOVE_DESC_ICON_HP}.`;
                } else if (eff.type === 'heal_pct') {
                    const who = targetPhrase || 'the target';
                    effectSentence = `Heals ${who} for ${moveDescPos(eff.value * 100 + '%')} of their max ${MOVE_DESC_ICON_HP}.`;
                } else if (eff.type === 'sleep') {
                    const who = targetPhrase ? ` ${targetPhrase}` : '';
                    effectSentence = `Has a ${moveDescNeg(eff.chance * 100 + '%')} chance to Sleep${who} for up to ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'poison_flat') {
                    const who = targetPhrase || 'the target';
                    effectSentence = `Poisons ${who}, dealing ${moveDescNeg(eff.value)} damage per turn for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'poison_pct') {
                    const who = targetPhrase || 'the target';
                    effectSentence = `Poisons ${who}, dealing ${moveDescNeg(eff.value * 100 + '%')} of their max ${MOVE_DESC_ICON_HP} as damage per turn for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'toxin_pct') {
                    const who = targetPhrase || 'the target';
                    effectSentence = `Inflicts Toxin on ${who}, dealing ${moveDescNeg(eff.value * 100 + '%')} of their max ${MOVE_DESC_ICON_HP} as damage per turn for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'stun') {
                    const who = targetPhrase ? ` ${targetPhrase}` : '';
                    effectSentence = `Has a ${moveDescNeg(eff.chance * 100 + '%')} chance to Stun${who} for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'regen_flat') {
                    const who = targetPhrase ? ` to ${targetPhrase}` : '';
                    effectSentence = `Grants Regeneration${who}, healing ${moveDescPos(eff.value)} ${MOVE_DESC_ICON_HP} per turn for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'regen_pct') {
                    const who = targetPhrase ? ` to ${targetPhrase}` : '';
                    effectSentence = `Grants Regeneration${who}, healing ${moveDescPos(eff.value * 100 + '%')} of max ${MOVE_DESC_ICON_HP} per turn for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'brambles') {
                    effectSentence = `Grants Thorns, reflecting ${moveDescPos(eff.value)} damage back to the attacker when hit for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'counter') {
                    effectSentence = `Grants Counter for ${eff.turns} ${turnsWord}. The next hit taken is completely negated and ${moveDescPos(eff.value * 100 + '%')} of the damage is reflected back to the attacker.`;
                } else if (eff.type === 'taunt') {
                    effectSentence = `Taunts all enemies for ${eff.turns} ${turnsWord}, forcing them to attack this monster.`;
                } else if (eff.type === 'savage_stance_pct') {
                    effectSentence = `Grants Savage Stance: a ${moveDescPos(eff.guard_value * 100 + '%')} shield until hit and ${moveDescPos(eff.atk_value * 100 + '%')} increased damage for ${eff.atk_turns} ${moveDescPluralTurns(eff.atk_turns)}.`;
                } else if (eff.type === 'overcharge_buff') {
                    effectSentence = `Grants ${moveDescPos(eff.value * 100 + '%')} chance to gain bonus ${MOVE_DESC_ICON_EN} upon attacking for ${eff.turns} ${turnsWord}.`;
                } else if (eff.type === 'lifesteal_buff') {
                    effectSentence = `Grants Lifesteal, causing attacks to heal this monster for ${moveDescPos(eff.value * 100 + '%')} of damage dealt for ${eff.turns} ${turnsWord}.`;
                }
            }

            if (m.p > 0) {
                const isAoE = m.effect && m.effect.target === 'all_enemies';
                const enemyTargetStr = isAoE ? 'all enemies' : 'an enemy';
                const hitsStr = m.hits > 1 ? ` ${m.hits} times` : '';
                let description = `Deals damage to ${enemyTargetStr}${hitsStr}.`;
                if (effectSentence) description += ` ${effectSentence}`;
                return description;
            } else if (effectSentence) {
                return effectSentence;
            }
            return "Deals damage.";
        }