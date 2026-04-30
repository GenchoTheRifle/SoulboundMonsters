// --- COLLECTION ---
        let currentCollectionTab = 'starters';
        function openCollection() {
            showScreen('screen-collection');
            switchCollectionTab('starters');
        }

        function switchCollectionTab(tab) {
            currentCollectionTab = tab;
            document.getElementById('tab-starters').classList.toggle('active', tab === 'starters');
            document.getElementById('tab-merges').classList.toggle('active', tab === 'merges');
            renderCollection();
        }

        function renderArt(art, size = 40) {
            if (art.includes('.png') || art.includes('/')) {
                return `<img src="${art}" style="max-width:100%; max-height:100%; object-fit:contain; image-rendering: pixelated;" />`;
            }
            return `<div style="font-size:${size}px; line-height:1;">${art}</div>`;
        }

        function openCollectionDetails(monster, isDiscovered, isMerge) {
            if (!isDiscovered) return;
            
            document.getElementById('col-detail-name').innerText = monster.name;
            
            const types = (Array.isArray(monster.type) ? monster.type : [monster.type]).filter(Boolean);
            
            let typeIconHtml = '';
            if (types.length === 2) {
                if (types.includes('Beast') && types.includes('Mech')) typeIconHtml = `<img src="Art/BeastMech.png" style="width:48px; height:48px;" title="Beast/Mech" />`;
                else if (types.includes('Mech') && types.includes('Nature')) typeIconHtml = `<img src="Art/MechNature.png" style="width:48px; height:48px;" title="Mech/Nature" />`;
                else if (types.includes('Nature') && types.includes('Beast')) typeIconHtml = `<img src="Art/NatureBeast.png" style="width:48px; height:48px;" title="Nature/Beast" />`;
            } else if (types.length === 1) {
                const icon = getElementIcon(types[0]);
                if (icon) typeIconHtml = `<img src="${icon}" style="width:48px; height:48px;" title="${types[0]}" />`;
            }
            
            document.getElementById('col-detail-types').innerHTML = typeIconHtml;
            
            document.getElementById('col-detail-art').innerHTML = renderArt(monster.art, 150);
            
            const matk = monster.matk !== undefined ? monster.matk : (monster.atk || 10);
            const mdef = monster.mdef !== undefined ? monster.mdef : 5;
            const ratk = monster.ratk !== undefined ? monster.ratk : (monster.atk || 10);
            const rdef = monster.rdef !== undefined ? monster.rdef : 5;

            document.getElementById('col-detail-stats').innerHTML = `
                <div><span style="color:#51cf66; display:inline-block; width:60px;">HP:</span> ${monster.hp}</div>
                <div><span style="color:#fcc419; display:inline-block; width:60px;">SPD:</span> ${monster.spd}</div>
                <div><span style="color:#ff6b6b; display:inline-block; width:60px;">MATK:</span> ${matk}</div>
                <div><span style="color:#ff6b6b; display:inline-block; width:60px;">MDEF:</span> ${mdef}</div>
                <div><span style="color:#339af0; display:inline-block; width:60px;">RATK:</span> ${ratk}</div>
                <div><span style="color:#339af0; display:inline-block; width:60px;">RDEF:</span> ${rdef}</div>
            `;
            
            const moves = monster.moves || [];
            
            document.getElementById('col-detail-moves').innerHTML = moves.map(m => {
                const typeIcon = getTypeIconHtml(m.t, 16);
                let moveCategory = '';
                const isAoE = m.effect && (m.effect.target === 'all_enemies' || m.effect.target === 'all_allies');
                
                if (isAoE) {
                    moveCategory = '<span style="color:#b19cd9; font-size:12px;">[AoE]</span>';
                } else if (!m.p) {
                    moveCategory = '<span style="color:#ff9ff3; font-size:12px;">[Utility]</span>';
                } else if (m.melee) {
                    moveCategory = '<span style="color:#ff6b6b; font-size:12px;">[Melee]</span>';
                } else {
                    moveCategory = '<span style="color:#339af0; font-size:12px;">[Ranged]</span>';
                }
                
                let description = getMoveDescription(m);

                return `<div style="margin-bottom: 10px;">
                    <strong>${m.n}</strong> ${typeIcon} (${m.c} EN) ${moveCategory}
                    <div style="font-size: 14px; color: #ccc; margin-left: 20px; margin-top: 4px;">- ${description}</div>
                </div>`;
            }).join('');
            
            if (isMerge) {
                const p1 = STARTERS[monster.parents[0]];
                const p2 = STARTERS[monster.parents[1]];
                document.getElementById('col-detail-parents').innerText = `Parents: ${p1.name} + ${p2.name}`;
            } else {
                document.getElementById('col-detail-parents').innerText = '';
            }
            
            document.getElementById('modal-collection-details').style.display = 'flex';
        }

        function renderCollection() {
            const list = document.getElementById('collection-list');
            list.innerHTML = '';
            list.className = 'collection-grid'; // Add class for grid styling

            if (currentCollectionTab === 'starters') {
                Object.values(STARTERS).forEach(s => {
                    const unlocked = gameState.unlockedStarters.includes(s.id);
                    const card = document.createElement('div');
                    card.className = `collection-square ${unlocked ? '' : 'locked'}`;
                    card.onclick = () => openCollectionDetails(s, unlocked, false);
                    card.innerHTML = `
                        <div class="monster-art">${renderArt(s.art, 80)}</div>
                        <strong>${unlocked ? s.name : '???'}</strong>
                    `;
                    list.appendChild(card);
                });
            } else {
                MERGES.forEach(m => {
                    const discovered = gameState.discoveredMerges.includes(m.name);
                    const card = document.createElement('div');
                    card.className = `collection-square ${discovered ? '' : 'locked'}`;
                    card.onclick = () => openCollectionDetails(m, discovered, true);
                    
                    if (discovered) {
                        card.innerHTML = `
                            <div class="monster-art">${renderArt(m.art, 80)}</div>
                            <strong>${m.name}</strong>
                        `;
                    } else {
                        card.innerHTML = `
                            <div class="monster-art" style="font-size: 80px;">?</div>
                            <strong>???</strong>
                        `;
                    }
                    list.appendChild(card);
                });
            }
        }