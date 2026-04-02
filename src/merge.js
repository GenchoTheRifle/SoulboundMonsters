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
                    slot.innerHTML = `<strong>${s.name}</strong>`;
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
            
            currentRun.party.forEach((m, idx) => {
                if (mergeSlots.includes(m) || m.currentHp <= 0) return; // Hide dead monsters
                const btn = document.createElement('button');
                btn.style.width = '100%';
                btn.innerHTML = `${m.name} (HP: ${m.currentHp}/${m.hp})`;
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
                currentRun.party = currentRun.party.filter(m => m !== p1 && m !== p2);
                currentRun.party.push(newMonster);

                if (!gameState.discoveredMerges.includes(outcome.name)) {
                    gameState.discoveredMerges.push(outcome.name);
                    saveGame();
                }

                showGameAlert("Merge Success", `Merged into ${outcome.name}!`, () => {
                    mergeSlots = [null, null];
                    updateMergeUI();
                });
            } else {
                showGameAlert("Merge Error", "These monsters cannot merge!");
            }
        }

        function finishMerge() {
            currentRun.nodeIndex++;
            showScreen('screen-map');
            renderMap();
        }