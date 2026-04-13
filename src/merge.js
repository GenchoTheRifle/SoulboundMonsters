// --- MERGE ENGINE ---
        function initMerge() {
            showScreen('screen-merge');
            mergeSlots = [null, null];
            updateMergeUI();
        }

        function updateMergeUI() {
            // Update Party Slots
            for (let i = 0; i < 4; i++) {
                const slot = document.getElementById(`merge-party-slot-${i}`);
                const m = currentRun.party[i];
                if (m && !mergeSlots.includes(m)) {
                    slot.innerHTML = `
                        <div draggable="true" ondragstart="dragStart(event, 'party', ${i})" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:grab;">
                            <div style="width:80px; height:80px; margin-bottom:5px;">
                                ${renderArt(m.art, 60)}
                            </div>
                            <strong style="font-size:12px; text-align:center;">${m.name}</strong>
                        </div>
                    `;
                    slot.classList.add('filled');
                } else {
                    slot.innerHTML = '';
                    slot.classList.remove('filled');
                }
            }

            // Update Merge Slots
            mergeSlots.forEach((s, i) => {
                const slot = document.getElementById(`merge-slot-${i}`);
                if (s) {
                    slot.classList.add('filled');
                    slot.innerHTML = `
                        <div draggable="true" ondragstart="dragStart(event, 'merge', ${i})" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:grab;">
                            <div style="width:80px; height:80px; margin-bottom:5px;">
                                ${renderArt(s.art, 60)}
                            </div>
                            <strong style="font-size:12px; text-align:center;">${s.name}</strong>
                        </div>
                    `;
                } else {
                    slot.classList.remove('filled');
                    slot.innerHTML = '+';
                }
            });
            document.getElementById('btn-do-merge').disabled = mergeSlots.includes(null);
        }

        function allowDrop(ev) {
            ev.preventDefault();
        }

        function dragStart(ev, source, index) {
            ev.dataTransfer.setData("source", source);
            ev.dataTransfer.setData("index", index);
        }

        function dropMergeParty(ev) {
            ev.preventDefault();
            const source = ev.dataTransfer.getData("source");
            const sourceIndex = parseInt(ev.dataTransfer.getData("index"));
            
            let targetSlot = ev.target.closest('.select-slot');
            if (!targetSlot) return;
            const targetIndex = parseInt(targetSlot.getAttribute('data-slot'));

            if (source === 'party') {
                // Swap in party
                const temp = currentRun.party[sourceIndex];
                currentRun.party[sourceIndex] = currentRun.party[targetIndex];
                currentRun.party[targetIndex] = temp;
            } else if (source === 'merge') {
                // Move from merge back to party
                const m = mergeSlots[sourceIndex];
                mergeSlots[sourceIndex] = null;
                // If target slot is empty, we don't need to do anything special since it's already in the party array, just not in mergeSlots anymore
                // But if we want to swap positions, we can find its original index and swap
                const originalIndex = currentRun.party.indexOf(m);
                if (originalIndex !== -1 && originalIndex !== targetIndex) {
                    const temp = currentRun.party[originalIndex];
                    currentRun.party[originalIndex] = currentRun.party[targetIndex];
                    currentRun.party[targetIndex] = temp;
                }
            }
            updateMergeUI();
        }

        function dropMergeSlot(ev) {
            ev.preventDefault();
            const source = ev.dataTransfer.getData("source");
            const sourceIndex = parseInt(ev.dataTransfer.getData("index"));
            
            let targetSlot = ev.target.closest('.merge-slot');
            if (!targetSlot) return;
            const targetIndex = parseInt(targetSlot.getAttribute('data-slot'));

            if (source === 'party') {
                const m = currentRun.party[sourceIndex];
                if (m && m.currentHp > 0) {
                    // If moving to a merge slot, check if it's already in the other slot
                    if (mergeSlots[1 - targetIndex] === m) {
                        mergeSlots[1 - targetIndex] = null;
                    }
                    mergeSlots[targetIndex] = m;
                }
            } else if (source === 'merge') {
                // Swap merge slots
                const temp = mergeSlots[sourceIndex];
                mergeSlots[sourceIndex] = mergeSlots[targetIndex];
                mergeSlots[targetIndex] = temp;
            }
            updateMergeUI();
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
                const p1Index = currentRun.party.indexOf(p1);
                const p2Index = currentRun.party.indexOf(p2);
                
                currentRun.party[p1Index] = newMonster;
                currentRun.party[p2Index] = null;

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
            const startersInParty = currentRun.party.filter(p => p && Object.keys(STARTERS).includes(p.id) && !p.name.includes('Alpha'));
            if (startersInParty.length >= 2) {
                showGameConfirm("Skip Merge?", "You have merge possibilities, are you sure you want to skip?", () => {
                    currentRun.nodeIndex++;
                    showScreen('screen-map');
                    renderMap();
                });
            } else {
                currentRun.nodeIndex++;
                showScreen('screen-map');
                renderMap();
            }
        }