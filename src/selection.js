// --- RUN SELECTION ---
        function updateSelectionUI() {
            selectionSlots.forEach((s, i) => {
                const slot = document.getElementById(`slot-${i}`);
                if (s) {
                    slot.classList.add('filled');
                    slot.innerHTML = `
                        <div style="height:50px; display:flex; justify-content:center; align-items:center; margin-bottom:5px;">${renderArt(s.art, 30)}</div>
                        <strong>${s.name}</strong><span style="font-size:10px">${s.type}</span>
                    `;
                } else {
                    slot.classList.remove('filled');
                    slot.innerHTML = '+';
                }
            });
            document.getElementById('btn-start-run').disabled = selectionSlots.includes(null);
        }

        function openSelectionModal(slotIndex) {
            const modal = document.getElementById('modal-selection');
            const list = document.getElementById('modal-list');
            document.getElementById('modal-title').innerText = "Select Starter";
            list.innerHTML = '';
            
            const closeBtn = document.getElementById('modal-selection-close-btn');
            closeBtn.onclick = () => closeModal('modal-selection');
            
            gameState.unlockedStarters.forEach(id => {
                const s = STARTERS[id];
                const btn = document.createElement('button');
                btn.style.width = '100%';
                btn.innerHTML = `${s.name} (${s.type})`;
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

        function showGameAlert(title, message, onDone) {
            document.getElementById('notif-title').innerText = title;
            document.getElementById('notif-message').innerText = message;
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