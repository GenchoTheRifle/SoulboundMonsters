// --- PAUSE & ABANDON ---
        function openPauseModal() {
            document.getElementById('modal-pause').style.display = 'flex';
        }

        function abandonRun() {
            closeModal('modal-pause');
            showGameConfirm("Abandon Run", "Are you sure you want to abandon the run? All progress will be lost.", () => {
                // Stop any fight still in flight: every pending turn/AI/endCombat timer checks `ended`,
                // so without this the enemy keeps acting (and can pop YOU DIED) behind the main menu.
                combatState.ended = true;
                combatState.isPlayerTurn = false;
                combatState.targetingMove = null;
                isExecutingMove = false;
                showScreen('screen-menu');
            });
        }

        // Start
        init();