// --- RUN ENGINE ---
        function startRun() {
            currentRun.party = selectionSlots.map(s => s ? { ...s, currentHp: s.hp } : null);
            currentRun.arcId = selectedArcId;
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
            
            // Generate vertical offsets
            const offsets = [];
            for (let i = 0; i < currentRun.nodes.length; i++) {
                const pattern = [0, -100, 80, -60, 120, -80, 60];
                offsets.push(pattern[i % pattern.length]);
            }

            currentRun.nodes.forEach((n, i) => {
                const nodeWrapper = document.createElement('div');
                nodeWrapper.className = 'node-container';
                
                const div = document.createElement('div');
                div.className = `node ${i === currentRun.nodeIndex ? 'active' : ''} ${i < currentRun.nodeIndex ? 'completed' : ''}`;
                div.innerText = n.type === 'boss' ? 'BOSS' : (n.type === 'combat' ? 'Battle' : 'Merge');
                
                // We don't need scale(1.1) here because it's in CSS for .node.active
                div.style.transform = `translateY(${offsets[i]}px)`;
                
                nodeWrapper.appendChild(div);

                if (i < currentRun.nodes.length - 1) {
                    const line = document.createElement('div');
                    line.className = `node-line ${i < currentRun.nodeIndex ? 'completed' : ''}`;
                    
                    const y1 = offsets[i];
                    const y2 = offsets[i+1];
                    const dy = y2 - y1;
                    const dx = 250; // min-width of node-container
                    const length = Math.sqrt(dx*dx + dy*dy);
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    
                    line.style.width = `${length}px`;
                    line.style.left = '125px'; // start from center of current node
                    line.style.top = `calc(50% + ${y1}px)`;
                    line.style.transformOrigin = 'left center';
                    line.style.transform = `rotate(${angle}deg)`;
                    
                    nodeWrapper.appendChild(line);
                }

                container.appendChild(nodeWrapper);
            });
            
            document.getElementById('btn-continue-node').disabled = currentRun.nodeIndex >= currentRun.nodes.length;

            // Auto-scroll to current node
            setTimeout(() => {
                const activeNode = container.children[currentRun.nodeIndex];
                if (activeNode) {
                    const scrollLeft = activeNode.offsetLeft - container.offsetWidth / 2 + activeNode.offsetWidth / 2;
                    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            }, 100);

            updateMapPartyUI();
        }

        function updateMapPartyUI() {
            for (let i = 0; i < 4; i++) {
                const slot = document.getElementById(`map-party-slot-${i}`);
                if (!slot) continue;
                const m = currentRun.party[i];
                if (m) {
                    slot.innerHTML = `
                        <div draggable="true" ondragstart="dragStartMap(event, ${i})" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:grab;">
                            <div style="width:80px; height:80px; margin-bottom:5px;">
                                ${renderArt(m.art, 60)}
                            </div>
                            <strong style="font-size:12px; text-align:center;">${m.name}</strong>
                        </div>
                    `;
                    slot.classList.add('filled');
                } else {
                    slot.innerHTML = '';
                    slot.classList.remove('filled');
                }
            }
        }

        function openMapTeamModal() {
            updateMapPartyUI();
            document.getElementById('modal-map-team').style.display = 'flex';
        }

        function dragStartMap(ev, index) {
            ev.dataTransfer.setData("index", index);
        }

        window.dropMapParty = function(ev) {
            ev.preventDefault();
            const sourceIndexStr = ev.dataTransfer.getData("index");
            if (!sourceIndexStr) return;
            const sourceIndex = parseInt(sourceIndexStr);
            
            let targetSlot = ev.target.closest('.select-slot');
            if (!targetSlot) return;
            const targetIndex = parseInt(targetSlot.getAttribute('data-slot'));

            // Swap in party
            const temp = currentRun.party[sourceIndex];
            currentRun.party[sourceIndex] = currentRun.party[targetIndex];
            currentRun.party[targetIndex] = temp;
            
            updateMapPartyUI();
        }

        function proceedToNode() {
            const node = currentRun.nodes[currentRun.nodeIndex];
            if (node.type === 'combat' || node.type === 'boss') {
                initCombat(node);
            } else if (node.type === 'merge') {
                initMerge();
            }
        }