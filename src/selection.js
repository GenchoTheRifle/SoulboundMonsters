// --- RUN SELECTION ---
        let draggedStarterId = null;
        let draggedFromSlot = null;
        let selectedArcId = null;

        window.startArc = function(arcId) {
            selectedArcId = arcId;
            const bgElement = document.getElementById('selection-bg');
            if (bgElement) bgElement.style.backgroundImage = getMapBackground(arcId);
            showScreen('screen-selection');
        };

        function updateSelectionUI() {
            selectionSlots.forEach((s, i) => {
                const slot = document.getElementById(`slot-${i}`);
                if (!slot) return;
                if (s) {
                    slot.classList.add('filled');
                    
                    slot.innerHTML = `
                        <div class="monster-art" style="pointer-events: none;">${renderArt(s.art, 140)}</div>
                        <strong style="pointer-events: none;">${s.name}</strong>
                    `;
                    slot.setAttribute('draggable', 'true');
                    slot.ondragstart = (e) => dragStartSelection(e, s.id, i);
                } else {
                    slot.classList.remove('filled');
                    slot.innerHTML = '';
                    slot.removeAttribute('draggable');
                    slot.ondragstart = null;
                }
            });
            
            const filledCount = selectionSlots.filter(s => s !== null).length;
            const btnStart = document.getElementById('btn-start-run');
            if (btnStart) btnStart.disabled = filledCount !== 2;

            // Render available starters
            const list = document.getElementById('selection-list');
            if (!list) return;
            list.innerHTML = '';
            
            const sortedStartersList = [...gameState.unlockedStarters].sort((a, b) => {
                return Object.keys(STARTERS).indexOf(a) - Object.keys(STARTERS).indexOf(b);
            });
            
            sortedStartersList.forEach(id => {
                // If it's already in a slot, don't show in list
                if (selectionSlots.some(s => s && s.id === id)) return;

                const s = STARTERS[id];
                if (!s) return;

                const btn = document.createElement('div');
                btn.className = 'collection-square';
                btn.style.cursor = 'grab';
                btn.setAttribute('draggable', 'true');
                btn.ondragstart = (e) => dragStartSelection(e, id, null);

                btn.innerHTML = `
                    <div class="monster-art" style="pointer-events: none;">${renderArt(s.art, 140)}</div>
                    <strong style="pointer-events: none;">${s.name}</strong>
                `;
                list.appendChild(btn);
            });
        }

        function dragStartSelection(e, id, slotIndex) {
            draggedStarterId = id;
            draggedFromSlot = slotIndex;
            e.dataTransfer.setData('text/plain', id);
        }

        window.allowDrop = function(e) {
            e.preventDefault();
        }

        window.drop = function(e) {
            e.preventDefault();
            const targetSlot = e.target.closest('.select-slot');
            if (!targetSlot) return;
            
            const slotIndex = parseInt(targetSlot.getAttribute('data-slot'));
            const id = draggedStarterId;
            
            if (!id) return;

            // If dragging from one slot to another
            if (draggedFromSlot !== null) {
                const temp = selectionSlots[slotIndex];
                selectionSlots[slotIndex] = selectionSlots[draggedFromSlot];
                selectionSlots[draggedFromSlot] = temp;
            } else {
                // Dragging from list to slot
                const filledCount = selectionSlots.filter(s => s !== null).length;
                
                // If slot is empty and we already have 2, don't allow
                if (!selectionSlots[slotIndex] && filledCount >= 2) {
                    return;
                }
                
                selectionSlots[slotIndex] = JSON.parse(JSON.stringify(STARTERS[id]));
            }
            
            updateSelectionUI();
        }

        window.dropList = function(e) {
            e.preventDefault();
            if (draggedFromSlot !== null) {
                selectionSlots[draggedFromSlot] = null;
                updateSelectionUI();
            }
        }

        function openSelectionModal(slotIndex) {
            const modal = document.getElementById('modal-selection');
            const list = document.getElementById('modal-list');
            document.getElementById('modal-title').innerText = "Select Starter";
            list.innerHTML = '';
            
            const closeBtn = document.getElementById('modal-selection-close-btn');
            closeBtn.onclick = () => closeModal('modal-selection');
            
            list.className = 'collection-grid';
            
            const sortedStartersModal = [...gameState.unlockedStarters].sort((a, b) => {
                return Object.keys(STARTERS).indexOf(a) - Object.keys(STARTERS).indexOf(b);
            });
            
            sortedStartersModal.forEach(id => {
                const s = STARTERS[id];
                const btn = document.createElement('div');
                btn.className = 'collection-square';
                
                btn.innerHTML = `
                    <div class="monster-art">${renderArt(s.art, 140)}</div>
                    <strong>${s.name}</strong>
                `;
                btn.onclick = () => {
                    selectionSlots[slotIndex] = JSON.parse(JSON.stringify(s));
                    updateSelectionUI();
                    closeModal('modal-selection');
                };
                list.appendChild(btn);
            });
            modal.style.display = 'flex';
        }

        function closeModal(id) {
            document.getElementById(id).style.display = 'none';
        }

        function showGameAlert(title, message, onDone, htmlContent = '') {
            document.getElementById('notif-title').innerText = title;
            document.getElementById('notif-message').innerText = message;
            
            let htmlContainer = document.getElementById('notif-html');
            if (!htmlContainer) {
                htmlContainer = document.createElement('div');
                htmlContainer.id = 'notif-html';
                document.getElementById('notif-message').after(htmlContainer);
            }
            htmlContainer.innerHTML = htmlContent;

            const modal = document.getElementById('modal-notification');
            const btn = modal.querySelector('button');
            btn.onclick = () => {
                closeModal('modal-notification');
                if (onDone) onDone();
            };
            modal.style.display = 'flex';
        }

        function showGameConfirm(title, message, onYes, onNo, htmlContent = '') {
            document.getElementById('confirm-title').innerText = title;
            document.getElementById('confirm-message').innerText = message;
            
            let htmlContainer = document.getElementById('confirm-html');
            if (!htmlContainer) {
                htmlContainer = document.createElement('div');
                htmlContainer.id = 'confirm-html';
                document.getElementById('confirm-message').after(htmlContainer);
            }
            htmlContainer.innerHTML = htmlContent;

            const modal = document.getElementById('modal-confirm');
            const yesBtn = document.getElementById('confirm-yes');
            const noBtn = document.getElementById('confirm-no');
            
            yesBtn.onclick = () => {
                closeModal('modal-confirm');
                if (onYes) onYes();
            };
            noBtn.onclick = () => {
                closeModal('modal-confirm');
                if (onNo) onNo();
            };
            modal.style.display = 'flex';
        }

        let firstTimeSelection = [];

        window.playClicked = function() {
            if (gameState.unlockedStarters.length < 2) {
                showScreen('screen-first-time');
                renderFirstTimeStarters();
            } else {
                showScreen('screen-menu');
            }
        }

        window.renderFirstTimeStarters = function() {
            const list = document.getElementById('first-time-list');
            list.innerHTML = '';
            const options = ['wolf', 'slime', 'sentry'];
            
            options.forEach(id => {
                const s = STARTERS[id];
                const btn = document.createElement('div');
                btn.className = 'collection-square';
                btn.style.width = '200px';
                btn.style.cursor = 'pointer';
                btn.style.transition = 'all 0.2s';
                
                const isSelected = firstTimeSelection.includes(id);
                if (isSelected) {
                    btn.style.borderColor = '#ffcc00';
                    btn.style.boxShadow = '0 0 15px #ffcc00';
                    btn.style.transform = 'scale(1.05)';
                }
                
                let extraLabels = '';
                if (s.id === 'wolf') {
                    extraLabels += `<div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #c62828; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #ff5252; z-index: 10;">Attacker</div>`;
                } else if (s.id === 'slime') {
                    extraLabels += `<div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #1565c0; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #42a5f5; z-index: 10;">Defender</div>`;
                } else if (s.id === 'sentry') {
                    extraLabels += `<div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #e6c200; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: black; border: 1px solid #ffee58; z-index: 10;">Balanced</div>`;
                }
                
                let elementIcon = `<img src="Art/${s.type}.png" style="width: 24px; height: 24px; position: absolute; top: 5px; right: 5px; filter: drop-shadow(0px 0px 2px #000);" alt="${s.type}" />`;
                
                btn.innerHTML = `
                    ${extraLabels}
                    ${elementIcon}
                    <div class="monster-art" style="pointer-events:none;">${renderArt(s.art, 160)}</div>
                    <strong style="font-size: 20px; pointer-events:none;">${s.name}</strong>
                `;
                
                btn.onclick = () => toggleFirstTimeStarter(id);
                list.appendChild(btn);
            });
            
            document.getElementById('btn-confirm-first-time').disabled = firstTimeSelection.length !== 2;
        }

        window.toggleFirstTimeStarter = function(id) {
            if (firstTimeSelection.includes(id)) {
                firstTimeSelection = firstTimeSelection.filter(s => s !== id);
            } else {
                if (firstTimeSelection.length < 2) {
                    firstTimeSelection.push(id);
                }
            }
            renderFirstTimeStarters();
        }

        window.confirmFirstTime = function() {
            if (firstTimeSelection.length === 2) {
                gameState.unlockedStarters = [...firstTimeSelection];
                saveGame();
                showScreen('screen-menu');
            }
        }

        window.resetProgress = function() {
            showGameConfirm("RESET PROGRESS", "Are you sure you want to reset all your progress?", () => {
                localStorage.removeItem('soulbound_save');
                localStorage.removeItem('labborn_save');
                gameState = {
                    unlockedStarters: [],
                    discoveredMerges: [],
                    maxActReached: 1
                };
                firstTimeSelection = [];
                playClicked();
            });
        }

        window.unlockAllProgress = function() {
            showGameConfirm("UNLOCK ALL PROGRESS", "Are you sure you want to unlock all starters, merges, and acts?", () => {
                const allStarters = Object.keys(STARTERS);
                const allMerges = MERGES.map(m => m.name);
                gameState = {
                    unlockedStarters: allStarters,
                    discoveredMerges: allMerges,
                    maxActReached: 3
                };
                saveGame();
                showScreen('screen-menu');
            });
        }