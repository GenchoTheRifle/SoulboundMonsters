// --- COLLECTION ---
        let currentCollectionTab = 'starters';
        let pauseReturnScreen = null;

        function openCollection() {
            showScreen('screen-collection');
            switchCollectionTab('starters');
        }

        function openCollectionFromPause() {
            pauseReturnScreen = document.querySelector('.screen.active').id;
            closeModal('modal-pause');
            openCollection();
        }

        function closeCollection() {
            if (pauseReturnScreen) {
                showScreen(pauseReturnScreen);
                pauseReturnScreen = null;
                openPauseModal();
            } else {
                showScreen('screen-menu');
            }
        }

        function switchCollectionTab(tab) {
            currentCollectionTab = tab;
            document.getElementById('tab-starters').classList.toggle('active', tab === 'starters');
            document.getElementById('tab-merges').classList.toggle('active', tab === 'merges');
            renderCollection();
        }

        function renderArt(art, size = 40) {
            if (art.includes('.png') || art.includes('/')) {
                return `<img src="${art}" style="width:${size}px; height:${size}px; object-fit:contain; image-rendering: pixelated;" draggable="false" />`;
            }
            return `<div style="font-size:${size}px; line-height:1;">${art}</div>`;
        }

        function buildTypeIconHtml(monster) {
            const types = (Array.isArray(monster.type) ? monster.type : [monster.type]).filter(Boolean);

            if (types.length === 2) {
                if (types.includes('Beast') && types.includes('Mech')) return `<img src="Art/BeastMech.png" style="width:48px; height:48px;" title="Beast/Mech" />`;
                if (types.includes('Mech') && types.includes('Nature')) return `<img src="Art/MechNature.png" style="width:48px; height:48px;" title="Mech/Nature" />`;
                if (types.includes('Nature') && types.includes('Beast')) return `<img src="Art/NatureBeast.png" style="width:48px; height:48px;" title="Nature/Beast" />`;
            } else if (types.length === 1) {
                const icon = getElementIcon(types[0]);
                if (icon) return `<img src="${icon}" style="width:48px; height:48px;" title="${types[0]}" />`;
            }
            return '';
        }

        // HP/EN use their icon instead of a text label; the other stat labels are bolded.
        function buildStatsListHtml(monster) {
            const matk = monster.matk !== undefined ? monster.matk : (monster.atk || 10);
            const mdef = monster.mdef !== undefined ? monster.mdef : 5;
            const ratk = monster.ratk !== undefined ? monster.ratk : (monster.atk || 10);
            const rdef = monster.rdef !== undefined ? monster.rdef : 5;
            const energy = monster.startingEnergy !== undefined ? monster.startingEnergy : 1;

            return `
                <div><img src="Art/HP.png" style="width:28px; height:28px; vertical-align:middle; filter: drop-shadow(1px 1px 1px black);" alt="HP" /> ${monster.hp}</div>
                <div><img src="Art/EN.png" style="width:28px; height:28px; vertical-align:middle; filter: drop-shadow(1px 1px 1px black);" alt="EN" /> ${energy}</div>
                <div><strong style="color:#ff6b6b; display:inline-block; width:60px;">MATK:</strong> ${matk}</div>
                <div><strong style="color:#ff6b6b; display:inline-block; width:60px;">MDEF:</strong> ${mdef}%</div>
                <div><strong style="color:#339af0; display:inline-block; width:60px;">RATK:</strong> ${ratk}</div>
                <div><strong style="color:#339af0; display:inline-block; width:60px;">RDEF:</strong> ${rdef}%</div>
                <div><strong style="color:#fcc419; display:inline-block; width:60px;">SPD:</strong> ${monster.spd}</div>
            `;
        }

        function buildMovesListHtml(monster) {
            const moves = (monster.moves || []).slice().sort((a, b) => (a.t || '').localeCompare(b.t || ''));

            return moves.map(m => {
                const typeIcon = getTypeIconHtml(m.t, 22);
                let moveCategory = '';
                let categoryColor = '';
                const isAoE = m.effect && (m.effect.target === 'all_enemies' || m.effect.target === 'all_allies');

                if (isAoE) {
                    categoryColor = '#b19cd9';
                    moveCategory = `<span style="color:${categoryColor}; font-size:18px;">[AoE]</span>`;
                } else if (!m.p) {
                    categoryColor = '#ff9ff3';
                    moveCategory = `<span style="color:${categoryColor}; font-size:18px;">[Utility]</span>`;
                } else if (m.melee) {
                    categoryColor = '#ff6b6b';
                    moveCategory = `<span style="color:${categoryColor}; font-size:18px;">[Melee]</span>`;
                } else {
                    categoryColor = '#339af0';
                    moveCategory = `<span style="color:${categoryColor}; font-size:18px;">[Ranged]</span>`;
                }

                let description = getMoveDescription(m);

                return `<div style="margin-bottom: 10px;">
                    <strong style="font-size: 30px; color: ${categoryColor};">${m.n}</strong> ${typeIcon} (${m.c} <img src="Art/EN.png" style="width:26px; height:26px; vertical-align:middle; filter: drop-shadow(1px 1px 1px black);" alt="EN" />) ${moveCategory}
                    <div class="move-description-text" style="font-size: 18px; color: #fff; margin-left: 20px; margin-top: 4px;">- ${description}</div>
                </div>`;
            }).join('');
        }

        function buildParentsHtml(monster, isMerge) {
            if (!isMerge) return '';

            const p1 = STARTERS[monster.parents[0]];
            const p2 = STARTERS[monster.parents[1]];
            return `
                <div style="font-size: 32px; color: #fff; margin-bottom: 8px;">Parents</div>
                <div style="display: flex; align-items: center; justify-content: center; gap: 14px;">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        ${renderArt(p1.art, 80)}
                        <span style="font-size: 24px; color: #fff; margin-top: 4px;">${p1.name}</span>
                    </div>
                    <div style="font-size: 26px; color: #fff; text-shadow: var(--outline-med);">+</div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        ${renderArt(p2.art, 80)}
                        <span style="font-size: 24px; color: #fff; margin-top: 4px;">${p2.name}</span>
                    </div>
                </div>
            `;
        }

        // Collection screen's monster detail popup: art/name/type column on the
        // left, stats + moves column on the right.
        function buildCollectionDetailHtml(monster, isMerge) {
            const typeIconHtml = buildTypeIconHtml(monster);
            const statsHtml = buildStatsListHtml(monster);
            const movesHtml = buildMovesListHtml(monster);
            const parentsHtml = buildParentsHtml(monster, isMerge);

            return `
                <div class="detail-columns">
                    <div class="detail-column-art">
                        <div class="detail-art-box">
                            <h2 style="font-size: 42px; margin: 0 0 10px 0; text-align: center; color: #fff;">${monster.name}</h2>
                            <div class="type-container" style="margin-bottom: 20px; display: flex; justify-content: center;">${typeIconHtml}</div>
                            <div class="monster-art" style="display: flex; justify-content: center; align-items: center;">${renderArt(monster.art, 240)}</div>
                        </div>
                        ${isMerge ? `<div class="detail-parents-box" style="text-align: center;">${parentsHtml}</div>` : ''}
                    </div>
                    <div class="detail-column-stats">
                        <div class="stats-row">${statsHtml}</div>
                        <div class="detail-section-label">Moves</div>
                        <div class="moves-list">${movesHtml}</div>
                    </div>
                </div>
            `;
        }

        // Starter-selection stat popup: art/name on top (element icon pinned to
        // the corner), stats in the bottom-left box, moves in the bottom-right box.
        function buildStarterPopupDetailHtml(monster, artSize = 190) {
            const typeIconHtml = buildTypeIconHtml(monster);
            const statsHtml = buildStatsListHtml(monster);
            const movesHtml = buildMovesListHtml(monster);

            return `
                <div class="detail-top">
                    <div class="detail-type-icon">${typeIconHtml}</div>
                    <h2 style="font-size: 42px; margin: 0 0 10px 0; text-align: center; color: #fff;">${monster.name}</h2>
                    <div class="monster-art" style="display: flex; justify-content: center; align-items: center;">${renderArt(monster.art, artSize)}</div>
                </div>
                <div class="detail-bottom">
                    <div class="detail-bottom-stats">
                        <div class="detail-section-label">Stats</div>
                        <div class="stats-row">${statsHtml}</div>
                    </div>
                    <div class="detail-bottom-moves">
                        <div class="detail-section-label">Moves</div>
                        <div class="moves-list">${movesHtml}</div>
                    </div>
                </div>
            `;
        }

        function openCollectionDetails(monster, isDiscovered, isMerge) {
            if (!isDiscovered) return;

            document.getElementById('col-detail-body').innerHTML = buildCollectionDetailHtml(monster, isMerge);
            const modal = document.getElementById('modal-collection-details');
            modal.querySelector('button').onclick = () => closeModal('modal-collection-details');
            modal.style.display = 'flex';
        }

        // Reuses the collection detail card to show a merge's outcome monster,
        // with an onClose callback (e.g. to reset merge slots) instead of the
        // plain close-only handler used from the collection screen.
        function showMergeResultDetails(monster, onClose) {
            document.getElementById('col-detail-body').innerHTML = buildCollectionDetailHtml(monster, !!monster.parents);
            const modal = document.getElementById('modal-collection-details');
            modal.querySelector('button').onclick = () => {
                closeModal('modal-collection-details');
                if (onClose) onClose();
            };
            modal.style.display = 'flex';
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
                    
                    if (unlocked) {
                        card.innerHTML = `
                            <div class="collection-type-icon">${getTypeIconHtml(s.type, 40)}</div>
                            <div class="monster-art">${renderArt(s.art, 200)}</div>
                            <strong>${s.name}</strong>
                        `;
                    } else {
                        card.innerHTML = `
                            <div class="monster-art" style="font-size: 200px; line-height: 200px; color: #fff; text-shadow: var(--outline-thick);">?</div>
                            <strong>???</strong>
                        `;
                    }
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
                            <div class="collection-type-icon">${getTypeIconHtml(m.type, 40)}</div>
                            <div class="monster-art">${renderArt(m.art, 200)}</div>
                            <strong>${m.name}</strong>
                        `;
                    } else {
                        card.innerHTML = `
                            <div class="monster-art" style="font-size: 200px; line-height: 200px; color: #fff; text-shadow: var(--outline-thick);">?</div>
                            <strong>???</strong>
                        `;
                    }
                    list.appendChild(card);
                });
            }
        }