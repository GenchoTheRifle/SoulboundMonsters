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

        function renderCollection() {
            const list = document.getElementById('collection-list');
            list.innerHTML = '';

            if (currentCollectionTab === 'starters') {
                Object.values(STARTERS).forEach(s => {
                    const unlocked = gameState.unlockedStarters.includes(s.id);
                    const card = document.createElement('div');
                    card.className = `monster-card ${unlocked ? '' : 'locked'}`;
                    card.innerHTML = `
                        <div class="type-container">
                            <div class="type-tag type-${s.type.toLowerCase()}">${s.type}</div>
                        </div>
                        <div class="monster-art" style="height:60px; display:flex; justify-content:center; align-items:center;">${renderArt(s.art)}</div>
                        <strong>${s.name}</strong>
                        ${unlocked ? `
                            <div class="stats-row">
                                <span>HP: ${s.hp}</span>
                                <span>ATK: ${s.atk}</span>
                                <span>SPD: ${s.spd}</span>
                            </div>
                            <div class="moves-list">${s.moves.map(m => `${m.n}(${m.c})`).join(', ')}</div>
                        ` : '<div style="margin-top:10px">LOCKED</div>'}
                    `;
                    list.appendChild(card);
                });
            } else {
                MERGES.forEach(m => {
                    const discovered = gameState.discoveredMerges.includes(m.name);
                    const card = document.createElement('div');
                    card.className = `monster-card ${discovered ? '' : 'locked'}`;
                    
                    if (discovered) {
                        const p1 = STARTERS[m.parents[0]];
                        const p2 = STARTERS[m.parents[1]];
                        const types = [...new Set([
                            ...(Array.isArray(p1.type) ? p1.type : [p1.type]),
                            ...(Array.isArray(p2.type) ? p2.type : [p2.type])
                        ])];
                        const moves = m.moves || [];
                        card.innerHTML = `
                            <div class="type-container">
                                ${types.map(t => `<div class="type-tag type-${t.toLowerCase()}">${t}</div>`).join('')}
                            </div>
                            <div class="monster-art" style="height:60px; display:flex; justify-content:center; align-items:center;">${renderArt(m.art)}</div>
                            <strong>${m.name}</strong>
                            <div style="font-size:10px; color:#888">${p1.name} + ${p2.name}</div>
                            <div class="stats-row">
                                <span>HP: ${m.hp}</span>
                                <span>ATK: ${m.atk}</span>
                                <span>SPD: ${m.spd}</span>
                            </div>
                            <div class="moves-list">${moves.map(mv => `${mv.n}(${mv.c})`).join(', ')}</div>
                        `;
                    } else {
                        card.innerHTML = `<strong>???</strong><div style="margin-top:10px">NOT DISCOVERED</div>`;
                    }
                    list.appendChild(card);
                });
            }
        }