// --- CORE LOGIC ---
        function scaleGame() {
            const container = document.getElementById('game-container');
            const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
            container.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }

        window.addEventListener('resize', scaleGame);

        async function init() {
            scaleGame();
            try {
                const response = await fetch('/data.json');
                const data = await response.json();
                ELEMENTS = data.ELEMENTS;
                STARTERS = data.STARTERS;
                MERGES = data.MERGES;
                BOSSES = data.BOSSES;

                function getMonsterType(id) {
                    const starter = STARTERS[id];
                    if (starter) return Array.isArray(starter.type) ? starter.type : [starter.type];
                    
                    const merge = MERGES.find(m => m.name.toLowerCase().replace(' ', '') === id || m.id === id);
                    if (merge) {
                        if (merge.type) return Array.isArray(merge.type) ? merge.type : [merge.type];
                        const p1Types = getMonsterType(merge.parents[0]);
                        const p2Types = getMonsterType(merge.parents[1]);
                        const types = [...new Set([...p1Types, ...p2Types])];
                        merge.type = types;
                        return types;
                    }
                    return [];
                }

                MERGES.forEach(m => {
                    m.id = m.name.toLowerCase().replace(' ', '');
                    m.type = getMonsterType(m.id);
                });
            } catch (e) {
                console.error("Failed to load game data", e);
            }

            const saved = localStorage.getItem('labborn_save');
            if (saved) {
                gameState = JSON.parse(saved);
            }
            showScreen('screen-title');
        }

        function saveGame() {
            localStorage.setItem('labborn_save', JSON.stringify(gameState));
        }

        function showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(screenId).classList.add('active');
            
            if (screenId === 'screen-selection') {
                selectionSlots = [null, null, null, null];
                updateSelectionUI();
            }
        }

        function getElementIcon(type) {
            if (type === 'Nature') return '/Art/Nature.png';
            if (type === 'Mech') return '/Art/Mech.png';
            if (type === 'Beast') return '/Art/Beast.png';
            return '';
        }