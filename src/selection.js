// --- RUN SELECTION ---
        let draggedStarterId = null;
        let draggedFromSlot = null;
        let selectedArcId = null;

        window.startArc = function(arcId) {
            selectedArcId = arcId;
            showScreen('screen-selection');
        };

        function updateSelectionUI() {
            selectionSlots.forEach((s, i) => {
                const slot = document.getElementById(`slot-${i}`);
                if (!slot) return;
                if (s) {
                    slot.classList.add('filled');
                    const typeHtml = getTypeIconHtml(s.type, 24);
                    slot.innerHTML = `
                        <div style="height:80px; display:flex; justify-content:center; align-items:center; margin-bottom:5px; pointer-events: none;">${renderArt(s.art, 60)}</div>
                        <strong style="pointer-events: none;">${s.name}</strong>
                        <div style="display:flex; gap:2px; margin-top:2px; pointer-events: none; justify-content:center;">${typeHtml}</div>
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
            
            gameState.unlockedStarters.forEach(id => {
                // If it's already in a slot, don't show in list
                if (selectionSlots.some(s => s && s.id === id)) return;

                const s = STARTERS[id];
                if (!s) return;

                const btn = document.createElement('div');
                btn.className = 'collection-square';
                btn.style.cursor = 'grab';
                btn.setAttribute('draggable', 'true');
                btn.ondragstart = (e) => dragStartSelection(e, id, null);

                const typeHtml = getTypeIconHtml(s.type, 28);

                btn.innerHTML = `
                    <div style="height:80px; display:flex; justify-content:center; align-items:center; margin-bottom:5px; pointer-events: none;">${renderArt(s.art, 60)}</div>
                    <strong style="pointer-events: none;">${s.name}</strong>
                    <div style="display:flex; gap:2px; margin-top:2px; justify-content:center; pointer-events: none;">${typeHtml}</div>
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
            
            gameState.unlockedStarters.forEach(id => {
                const s = STARTERS[id];
                const btn = document.createElement('div');
                btn.className = 'collection-square';
                
                const typeHtml = getTypeIconHtml(s.type, 28);

                btn.innerHTML = `
                    <div style="height:80px; display:flex; justify-content:center; align-items:center; margin-bottom:10px;">${renderArt(s.art, 60)}</div>
                    <strong>${s.name}</strong>
                    <div style="display:flex; gap:2px; margin-top:5px; justify-content:center;">${typeHtml}</div>
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

        function showGameConfirm(title, message, onYes, onNo) {
            document.getElementById('confirm-title').innerText = title;
            document.getElementById('confirm-message').innerText = message;
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
                btn.style.width = '180px';
                btn.style.height = '180px';
                btn.style.cursor = 'pointer';
                btn.style.transition = 'all 0.2s';
                
                const isSelected = firstTimeSelection.includes(id);
                if (isSelected) {
                    btn.style.borderColor = '#ffcc00';
                    btn.style.boxShadow = '0 0 15px #ffcc00';
                    btn.style.transform = 'scale(1.05)';
                }
                
                const typeHtml = getTypeIconHtml(s.type, 32);

                btn.innerHTML = `
                    <div style="height:80px; display:flex; justify-content:center; align-items:center; margin-bottom:10px; pointer-events:none;">${renderArt(s.art, 60)}</div>
                    <strong style="font-size: 20px; pointer-events:none;">${s.name}</strong>
                    <div style="display:flex; gap:5px; margin-top:10px; justify-content:center; pointer-events:none;">${typeHtml}</div>
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
            if (confirm("Are you sure you want to reset all your progress?")) {
                localStorage.removeItem('soulbound_save');
                localStorage.removeItem('labborn_save');
                location.reload();
            }
        }