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
            
            if (currentMax < 2) {
                btn2.style.opacity = '0.5';
                btn2.style.pointerEvents = 'none';
                document.getElementById('text-arc2').innerText = 'LOCKED';
            } else {
                btn2.style.opacity = '1';
                btn2.style.pointerEvents = 'auto';
                document.getElementById('text-arc2').innerText = 'ACT 2';
            }

            if (currentMax < 3) {
                btn3.style.opacity = '0.5';
                btn3.style.pointerEvents = 'none';
                document.getElementById('text-arc3').innerText = 'LOCKED';
            } else {
                btn3.style.opacity = '1';
                btn3.style.pointerEvents = 'auto';
                document.getElementById('text-arc3').innerText = 'ACT 3';
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

        function getMoveDescription(m) {
            let description = '';
            let effectDesc = '';
            
            if (m.effect) {
                const eff = m.effect;
                let targetStr = eff.target === 'all_enemies' ? 'all enemies' : (eff.target === 'all_allies' ? 'all allies' : (eff.target === 'self' ? 'this monster' : 'the target'));
                
                if (eff.chance && eff.chance < 1) {
                    if (eff.target === 'all_enemies') targetStr = 'each enemy';
                    if (eff.target === 'all_allies') targetStr = 'each ally';
                }

                if (eff.type === 'atk_buff_pct') {
                    effectDesc = `increases the damage of ${targetStr} by ${eff.value * 100}% for ${eff.turns} turns`;
                } else if (eff.type === 'guard_pct') {
                    effectDesc = `reduces incoming damage to ${targetStr} by ${eff.value * 100}% until hit`;
                } else if (eff.type === 'heal_flat') {
                    effectDesc = `heals ${targetStr} for ${eff.value} HP`;
                } else if (eff.type === 'heal_pct') {
                    effectDesc = `heals ${targetStr} for ${eff.value * 100}% of their max HP`;
                } else if (eff.type === 'sleep') {
                    effectDesc = `has a ${eff.chance * 100}% chance to put ${targetStr} to sleep for up to ${eff.turns} turns`;
                } else if (eff.type === 'poison_flat') {
                    effectDesc = `poisons ${targetStr}, dealing ${eff.value} flat damage per turn for ${eff.turns} turns`;
                } else if (eff.type === 'poison_pct') {
                    effectDesc = `poisons ${targetStr}, dealing ${eff.value * 100}% of their max HP as damage per turn for ${eff.turns} turns`;
                } else if (eff.type === 'toxin_pct') {
                    effectDesc = `inflicts Toxin on ${targetStr}, dealing ${eff.value * 100}% of their max HP as damage per turn for ${eff.turns} turns`;
                } else if (eff.type === 'stun') {
                    effectDesc = `has a ${eff.chance * 100}% chance to stun ${targetStr} for ${eff.turns} turn(s)`;
                } else if (eff.type === 'spd_buff_pct') {
                    effectDesc = `increases the speed of ${targetStr} by ${eff.value * 100}% for ${eff.turns} turns`;
                } else if (eff.type === 'spd_debuff_pct') {
                    effectDesc = `decreases the speed of ${targetStr} by ${eff.value * 100}% for ${eff.turns} turns`;
                } else if (eff.type === 'atk_debuff_pct') {
                    effectDesc = `decreases the damage of ${targetStr} by ${eff.value * 100}% for ${eff.turns} turns`;
                } else if (eff.type === 'regen_flat') {
                    effectDesc = `applies health regeneration to ${targetStr}, healing ${eff.value} HP per turn for ${eff.turns} turns`;
                } else if (eff.type === 'regen_pct') {
                    effectDesc = `applies health regeneration to ${targetStr}, healing ${eff.value * 100}% of their max HP per turn for ${eff.turns} turns`;
                } else if (eff.type === 'brambles') {
                    effectDesc = `grants ${targetStr} Thorns, reflecting ${eff.value} flat damage back to the attacker when hit by direct attacks for ${eff.turns} turns`;
                } else if (eff.type === 'counter') {
                    effectDesc = `applies Counter to ${targetStr} for ${eff.turns} turn(s). The next hit taken is completely negated and ${eff.value * 100}% of the damage is reflected back to the attacker`;
                } else if (eff.type === 'taunt') {
                    effectDesc = `taunts all enemies for ${eff.turns} turn(s), forcing them to attack ${targetStr}`;
                } else if (eff.type === 'savage_stance_pct') {
                    effectDesc = `grants ${targetStr} Savage Stance, granting a ${eff.guard_value * 100}% shield until hit and increasing damage by ${eff.atk_value * 100}% for ${eff.atk_turns} turns`;
                } else if (eff.type === 'overcharge_buff') {
                    effectDesc = `grants ${targetStr} a ${eff.value * 100}% chance to gain bonus energy upon attacking for ${eff.turns} turns`;
                } else if (eff.type === 'lifesteal_buff') {
                    effectDesc = `grants ${targetStr} lifesteal, causing their attacks to heal them for ${eff.value * 100}% of damage dealt for ${eff.turns} turns`;
                }
            }
            
            if (m.p > 0) {
                const isAoE = m.effect && m.effect.target === 'all_enemies';
                const enemyTargetStr = isAoE ? 'all enemies' : 'an enemy';
                if (m.hits > 1) {
                    description = `Deals damage to ${enemyTargetStr} ${m.hits} times.`;
                    if (effectDesc) {
                        description = `Deals damage to ${enemyTargetStr} ${m.hits} times and ${effectDesc}.`;
                    }
                } else {
                    description = `Deals damage to ${enemyTargetStr}.`;
                    if (effectDesc) {
                        description = `Deals damage to ${enemyTargetStr} and ${effectDesc}.`;
                    }
                }
            } else if (effectDesc) {
                description = effectDesc.charAt(0).toUpperCase() + effectDesc.slice(1) + '.';
            } else {
                description = "Deals damage.";
            }

            return description;
        }