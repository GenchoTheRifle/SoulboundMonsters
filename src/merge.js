// --- MERGE ENGINE ---
        function initMerge() {
            const bgElement = document.getElementById('merge-bg');
            if (bgElement && currentRun.arcId) bgElement.style.backgroundImage = getMapBackground(currentRun.arcId);
            showScreen('screen-merge');
            mergeSlots = [null, null];
            updateMergeUI();
        }

        function updateMergeUI() {
        if (currentRun && currentRun.arcId) {
            const bgEl = document.getElementById('merge-arena-bg');
            if (bgEl) {
                bgEl.style.backgroundImage = getMapBackground(currentRun.arcId);
            }
        }
        
        // Update Party Slots
        for (let i = 0; i < 4; i++) {
            const slot = document.getElementById(`merge-party-slot-${i}`);
            const m = currentRun.party[i];
            if (m && !mergeSlots.includes(m)) {
                slot.classList.add('filled');
                slot.classList.add('combatant');
                slot.classList.add('combatant');
                
                const hpPerc = Math.max(0, Math.min(100, (m.currentHp / m.hp) * 100));
                let hpColor = hpPerc > 50 ? '#22c55e' : hpPerc > 25 ? '#eab308' : '#ef4444';
                const mEnergy = m.energy !== undefined ? m.energy : (m.startingEnergy !== undefined ? m.startingEnergy : 1);
                
                
                slot.innerHTML = `
                    <div draggable="true" ondragstart="dragStart(event, 'party', ${i})" style="width:100%; height:100%; position: absolute; top:0; left:0; z-index: 20; cursor:grab;"></div>
                    <div class="monster-art-container" style="pointer-events: none;">
                        <div class="art-content" style="position: relative;">
                            ${m.art.includes(".png") ? `<img src="${m.art}" draggable="false" />` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${m.art}</div>`}
                        </div>
                        <div class="shadow-ellipse ${getShadowClass(m.name)}"></div>
                    </div>
                    <div class="stats-container" style="position: relative; padding-top: 10px; z-index: 10; width: 100%; box-sizing: border-box; pointer-events: none;">
                        <div class="type-icon-container" style="position: absolute; top: -10px; right: -10px; z-index: 11;">
                            ${getTypeIconHtml(m.type, 40)}
                        </div>
                        <div class="name" style="text-align: center; color: white; font-weight: normal; font-size: 20px; text-shadow: var(--outline-med); margin-bottom: 4px;">
                            ${m.name}
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                            <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                            <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 15px; background: #222; border-radius: 6px; overflow: hidden;">
                                <div class="hp-fill" style="width:${hpPerc}%; background-color:${hpColor};"></div>
                                <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: normal; text-shadow: var(--outline-thin); pointer-events: none;">
                                    ${m.currentHp}/${m.hp}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                            <img src="Art/EN.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="EN" />
                            <div class="energy-blocks" style="display: flex; gap: 4px; flex: 1;">
                                ${(m.isBoss ? [1,2,3,4,5] : [1,2,3]).map(i => `<div style="flex: 1; height: 6px; background-color: ${mEnergy >= i ? '#00a8ff' : '#222'}; border-radius: 2px;"></div>`).join('')}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                slot.innerHTML = '';
                slot.classList.remove('filled');
                slot.classList.remove('combatant');
            }
        }
        
        // Update Merge Slots
        mergeSlots.forEach((s, i) => {
            const slot = document.getElementById(`merge-slot-${i}`);
            if (s) {
                slot.classList.add('filled');
                slot.innerHTML = `
                    <div draggable="true" ondragstart="dragStart(event, 'merge', ${i})" style="width:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; cursor:grab;">
                        <div class="monster-art-container" style="pointer-events: none;">
                            <div class="art-content" style="position: relative;">
                                ${s.art.includes(".png") ? `<img src="${s.art}" draggable="false" />` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${s.art}</div>`}
                            </div>
                            <div class="shadow-ellipse ${getShadowClass(s.name)}"></div>
                        </div>
                        <strong style="font-size:24px; text-align:center; pointer-events:none; text-shadow: var(--outline-med);">${s.name}</strong>
                        <div style="width:100%; padding:0 16px; pointer-events:none;">${getMiniHpEnergyHtml(s)}</div>
                    </div>
                `;
            } else {
                slot.classList.remove('filled');
                slot.classList.remove('combatant');
                slot.innerHTML = '+';
            }
        });

        const btnMerge = document.getElementById('btn-do-merge');
        const outcomeDiv = document.getElementById('merge-outcome');
        
        if (mergeSlots[0] && mergeSlots[1]) {
            const p1 = mergeSlots[0];
            const p2 = mergeSlots[1];
            const outcome = MERGES.find(m => 
                (m.parents[0] === p1.id && m.parents[1] === p2.id) ||
                (m.parents[0] === p2.id && m.parents[1] === p1.id)
            );
            
            if (outcome) {
                btnMerge.disabled = false;
                btnMerge.classList.add('merge-btn-pulse');
                const isUnlocked = gameState.discoveredMerges && gameState.discoveredMerges.includes(outcome.name);

                if (isUnlocked) {
                    outcomeDiv.innerHTML = `
                        <h4 style="margin: 0 0 10px 0; color: #aaa; text-shadow: var(--outline-thin);">OUTCOME</h4>
                        <div class="merge-outcome-box">
                            <div class="monster-art-container" style="pointer-events: none; width: 100%; height: 190px;">
                                <div class="art-content" style="position: relative;">
                                    ${outcome.art.includes(".png") ? `<img src="${outcome.art}" draggable="false" style="max-height:190px;" />` : `<div style="font-size:110px; position:relative; z-index:2; line-height:1;">${outcome.art}</div>`}
                                </div>
                                <div class="shadow-ellipse ${getShadowClass(outcome.name)}"></div>
                            </div>
                            <strong style="font-size: 28px; margin-top: 8px; color: var(--accent); text-align: center; text-shadow: var(--outline-med);">${outcome.name}</strong>
                            <div style="width: 100%; padding: 0 12px; margin-top: 8px;">${getMiniHpEnergyHtml(outcome)}</div>
                        </div>
                    `;
                } else {
                    outcomeDiv.innerHTML = `
                        <h4 style="margin: 0 0 10px 0; color: #aaa; text-shadow: var(--outline-thin);">OUTCOME</h4>
                        <div class="merge-outcome-box">
                            <div style="font-size: 88px; color: #fff; text-shadow: var(--outline-thick);">?</div>
                            <strong style="font-size: 26px; margin-top: 14px; color: #ffd700; text-shadow: var(--outline-med);">NEW MERGE</strong>
                        </div>
                    `;
                }
            } else {
                btnMerge.disabled = true;
                btnMerge.classList.remove('merge-btn-pulse');
                outcomeDiv.innerHTML = `
                    <div style="color: #ff4444; font-weight: normal; font-size: 24px; text-shadow: var(--outline-med);">Incompatible</div>
                `;
            }
        } else {
            btnMerge.disabled = true;
            btnMerge.classList.remove('merge-btn-pulse');
            outcomeDiv.innerHTML = '';
        }

        const btnFinish = document.getElementById('btn-finish-merge');
        if (btnFinish) {
            btnFinish.classList.toggle('merge-btn-pulse', !hasAnyPossibleMerge());
        }
    }

    function hasAnyPossibleMerge() {
        const alive = currentRun.party.filter(m => m && m.currentHp > 0);
        for (let i = 0; i < alive.length; i++) {
            for (let j = i + 1; j < alive.length; j++) {
                const a = alive[i], b = alive[j];
                const found = MERGES.find(m =>
                    (m.parents[0] === a.id && m.parents[1] === b.id) ||
                    (m.parents[0] === b.id && m.parents[1] === a.id)
                );
                if (found) return true;
            }
        }
        return false;
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
                    <div style="height:120px; display:flex; justify-content:center; align-items:center; margin-bottom:10px;">${renderArt(m.art, 100)}</div>
                    <strong>${m.name}</strong>
                    <div style="width:100%; padding:0 6px; margin-top:6px;">${getMiniHpEnergyHtml(m)}</div>
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

                showMergeResultDetails(newMonster, () => {
                    mergeSlots = [null, null];
                    updateMergeUI();
                });
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
window.dropMergeList = function(e) {
    e.preventDefault();
    const source = e.dataTransfer.getData("source");
    const sourceIndex = parseInt(e.dataTransfer.getData("index"));
    
    if (source === 'merge') {
        mergeSlots[sourceIndex] = null;
        updateMergeUI();
    }
}
