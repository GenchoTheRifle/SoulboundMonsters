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
                return `<img src="${art}" style="max-width:100%; max-height:100%; object-fit:contain;" />`;
            }
            return `<div style="font-size:${size}px; line-height:1;">${art}</div>`;
        }

        function openCollectionDetails(monster, isDiscovered, isMerge) {
            if (!isDiscovered) return;
            
            document.getElementById('col-detail-name').innerText = monster.name;
            
            const types = (Array.isArray(monster.type) ? monster.type : [monster.type]).filter(Boolean);
            document.getElementById('col-detail-types').innerHTML = types.map(t => {
                const icon = getElementIcon(t);
                return icon ? `<img src="${icon}" style="width:32px; height:32px;" alt="${t}" title="${t}" />` : `<div class="type-tag type-${t.toLowerCase()}" style="font-size: 16px; padding: 5px 10px;">${t}</div>`;
            }).join('');
            
            document.getElementById('col-detail-art').innerHTML = renderArt(monster.art, 150);
            
            document.getElementById('col-detail-hp').innerText = `HP: ${monster.hp}`;
            document.getElementById('col-detail-atk').innerText = `ATK: ${monster.atk}`;
            document.getElementById('col-detail-spd').innerText = `SPD: ${monster.spd}`;
            
            const moves = monster.moves || [];
            document.getElementById('col-detail-moves').innerHTML = moves.map(m => `${m.n} (${m.c} EN)`).join('<br>');
            
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