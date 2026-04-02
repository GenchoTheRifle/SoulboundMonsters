// --- CORE LOGIC ---
        async function init() {
            try {
                const response = await fetch('/data.json');
                const data = await response.json();
                ELEMENTS = data.ELEMENTS;
                STARTERS = data.STARTERS;
                MERGES = data.MERGES;
                BOSSES = data.BOSSES;
            } catch (e) {
                console.error("Failed to load game data", e);
            }

            const saved = localStorage.getItem('labborn_save');
            if (saved) {
                gameState = JSON.parse(saved);
            }
            showScreen('screen-menu');
        }

        function saveGame() {
            localStorage.setItem('labborn_save', JSON.stringify(gameState));
        }

        function showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(screenId).classList.add('active');
            
            if (screenId === 'screen-selection') {
                selectionSlots = [null, null];
                updateSelectionUI();
            }
        }