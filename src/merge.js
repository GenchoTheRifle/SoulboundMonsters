// --- MERGE ENGINE ---
        function initMerge() {
            showScreen('screen-merge');
            mergeSlots = [null, null];
            updateMergeUI();
        }

        function updateMergeUI() {
            mergeSlots.forEach((s, i) => {
                const slot = document.getElementById(`merge-slot-${i}`);
                if (s) {
                    slot.classList.add('filled');
                    slot.innerHTML = `
                        <div style="width:80px; height:80px; margin-bottom:5px;">
                            ${renderArt(s.art, 60)}
                        </div>
                        <strong>${s.name}</strong>
                    `;
                } else {
                    slot.classList.remove('filled');
                    slot.innerHTML = '+';
                }
            });
            document.getElementById('btn-do-merge').disabled = mergeSlots.includes(null);
            document.getElementById('merge-result').innerText = '';
        }

        function openMergeModal(slotIndex) {
            const modal = document.getElementById('modal-selection');
            const list = document.getElementById('modal-list');
            document.getElementById('modal-title').innerText = "Select to Merge";
            list.innerHTML = '';
            
            const closeBtn = document.getElementById('modal-selection-close-btn');
            closeBtn.onclick = () => closeModal('modal-selection');
            
            list.className = 'collection-grid';
            
            currentRun.party.forEach((m, idx) => {
                if (mergeSlots.includes(m) || m.currentHp <= 0) return; // Hide dead monsters
                const btn = document.createElement('div');
                btn.className = 'collection-square';
                
                const types = (Array.isArray(m.type) ? m.type : [m.type]).filter(Boolean);
                const typeHtml = types.map(t => {
                    const icon = getElementIcon(t);
                    return icon ? `<img src="${icon}" style="width:28px; height:28px;" alt="${t}" title="${t}" />` : `<div class="type-tag type-${t.toLowerCase()}" style="font-size: 10px; padding: 2px 4px;">${t}</div>`;
                }).join('');

                btn.innerHTML = `
                    <div style="height:80px; display:flex; justify-content:center; align-items:center; margin-bottom:10px;">${renderArt(m.art, 60)}</div>
                    <strong>${m.name}</strong>
                    <div style="font-size:10px; color:#ccc; margin-top:2px;">HP: ${m.currentHp}/${m.hp}</div>
                    <div style="display:flex; gap:2px; margin-top:5px;">${typeHtml}</div>
                `;
                btn.onclick = () => {
                    mergeSlots[slotIndex] = m;
                    updateMergeUI();
                    closeModal('modal-selection');
                };
                list.appendChild(btn);
            });
            modal.style.display = 'flex';
        }

        function executeMerge() {
            const p1 = mergeSlots[0];
            const p2 = mergeSlots[1];
            
            // Find merge outcome
            const outcome = MERGES.find(m => 
                (m.parents[0] === p1.id && m.parents[1] === p2.id) ||
                (m.parents[0] === p2.id && m.parents[1] === p1.id)
            );

            if (outcome) {
                const types = [...new Set([
                    ...(Array.isArray(p1.type) ? p1.type : [p1.type]),
                    ...(Array.isArray(p2.type) ? p2.type : [p2.type])
                ])];

                const newMonster = {
                    ...outcome,
                    id: outcome.name.toLowerCase().replace(' ', ''),
                    type: types, // Inherit both parent types
                    currentHp: outcome.hp,
                    moves: outcome.moves || []
                };

                // Remove parents, add child
                currentRun.party = currentRun.party.map(p => {
                    if (p === p1) return newMonster;
                    if (p === p2) return null;
                    return p;
                });

                if (!gameState.discoveredMerges.includes(outcome.name)) {
                    gameState.discoveredMerges.push(outcome.name);
                    saveGame();
                }

                const htmlContent = `
                    <div style="display:flex; flex-direction:column; align-items:center; margin: 15px 0;">
                        <div style="width:150px; height:150px; margin-bottom:10px;">
                            ${renderArt(outcome.art, 100)}
                        </div>
                        <strong style="font-size:24px; color: var(--accent);">${outcome.name}</strong>
                    </div>
                `;

                showGameAlert("Merge Success", `Merged into ${outcome.name}!`, () => {
                    mergeSlots = [null, null];
                    updateMergeUI();
                }, htmlContent);
            } else {
                showGameAlert("Merge Error", "These monsters cannot merge!");
            }
        }

        function finishMerge() {
            currentRun.nodeIndex++;
            showScreen('screen-map');
            renderMap();
        }