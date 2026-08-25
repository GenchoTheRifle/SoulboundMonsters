// --- PAUSE & ABANDON ---
        function openPauseModal() {
            document.getElementById('modal-pause').style.display = 'flex';
        }

        function abandonRun() {
            closeModal('modal-pause');
            showGameConfirm("Abandon Run", "Are you sure you want to abandon the run? All progress will be lost.", () => {
                showScreen('screen-menu');
            });
        }

        // Start
        init();