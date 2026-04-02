// --- RUN ENGINE ---
        function startRun() {
            currentRun.party = selectionSlots.map(s => ({ ...s, currentHp: s.hp }));
            currentRun.nodeIndex = 0;
            currentRun.nodes = [
                { type: 'combat', level: 0 }, // Node 1: 1 enemy (Simple)
                { type: 'combat', level: 0 }, // Node 2: 1 enemy (Simple)
                { type: 'merge' },            // Node 3: Merge
                { type: 'combat', level: 1 }, // Node 4: 2 enemies (Simple)
                { type: 'combat', level: 2 }, // Node 5: 2 enemies (Advanced)
                { type: 'combat', level: 2 }, // Node 6: Combat
                { type: 'merge' },            // Node 7: Merge
                { type: 'combat', level: 3 }, // Node 8: Combat
                { type: 'combat', level: 3 }, // Node 9: Combat
                { type: 'boss' }              // Node 10: Boss
            ];
            showScreen('screen-map');
            renderMap();
        }

        function renderMap() {
            const container = document.getElementById('map-nodes');
            container.innerHTML = '';
            currentRun.nodes.forEach((n, i) => {
                const div = document.createElement('div');
                div.className = `node ${i === currentRun.nodeIndex ? 'active' : ''} ${i < currentRun.nodeIndex ? 'completed' : ''}`;
                div.innerText = `Node ${i + 1}: ${n.type.toUpperCase()}`;
                container.appendChild(div);
            });
            document.getElementById('btn-continue-node').disabled = currentRun.nodeIndex >= currentRun.nodes.length;
        }

        function proceedToNode() {
            const node = currentRun.nodes[currentRun.nodeIndex];
            if (node.type === 'combat' || node.type === 'boss') {
                initCombat(node);
            } else if (node.type === 'merge') {
                initMerge();
            }
        }