// --- RUN ENGINE ---
        function startRun() {
            const btn = document.getElementById('btn-start-run');
            if (btn) btn.disabled = true;
            
            // Create transition overlay
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.backgroundColor = 'black';
            overlay.style.zIndex = '9999';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.8s ease-in-out';
            
            const logo = document.createElement('img');
            logo.src = 'Art/Title.png';
            logo.style.width = '600px';
            logo.style.maxWidth = '80vw';
            logo.style.transform = 'translateY(-50px)';
            logo.style.opacity = '0';
            logo.style.transition = 'all 1s cubic-bezier(0.2, 0.8, 0.2, 1)';
            overlay.appendChild(logo);
            
            const actText = document.createElement('div');
            let actName = 'ACT I: THE CAVE';
            if (selectedArcId === 'arc2') actName = 'ACT II: THE FOREST';
            if (selectedArcId === 'arc3') actName = 'ACT III: THE LABORATORY';
            
            actText.innerText = actName;
            actText.style.color = 'white';
            actText.style.fontSize = '36px';
            actText.style.fontWeight = 'bold';
            actText.style.letterSpacing = '10px';
            actText.style.marginTop = '40px';
            actText.style.textShadow = '2px 2px 4px black';
            actText.style.opacity = '0';
            actText.style.transition = 'opacity 1s ease-in-out 0.5s';
            overlay.appendChild(actText);
            
            document.body.appendChild(overlay);
            
            // Start animation sequence
            setTimeout(() => {
                overlay.style.opacity = '1';
                
                setTimeout(() => {
                    logo.style.transform = 'translateY(0)';
                    logo.style.opacity = '1';
                    actText.style.opacity = '1';
                    
                    // Initialize run state in the background while black screen is up
                    currentRun.party = selectionSlots.map(s => s ? { ...s, currentHp: s.hp } : null);
                    currentRun.arcId = selectedArcId;
                    currentRun.nodeIndex = 0;
                    currentRun.nodes = [
                        { type: 'combat', level: 0 },
                        { type: 'combat', level: 0 },
                        { type: 'merge' },
                        { type: 'combat', level: 1 },
                        { type: 'combat', level: 2 },
                        { type: 'combat', level: 2 },
                        { type: 'merge' },
                        { type: 'combat', level: 3 },
                        { type: 'combat', level: 3 },
                        { type: 'boss' }
                    ];
                    initCombat(currentRun.nodes[0]);
                    
                    const drawer = document.getElementById('selection-drawer');
                    if (drawer) drawer.style.transform = 'translateX(100%)';
                    
                    const title = document.querySelector('#screen-selection h2');
                    const backBtn = document.querySelector('#screen-selection > button');
                    if (title) title.style.display = 'none';
                    if (backBtn) backBtn.style.display = 'none';
                    const selTeam = document.getElementById('selection-player-team');
                    if (selTeam) selTeam.style.opacity = '0';
                    
                    // Fade out
                    setTimeout(() => {
                        overlay.style.opacity = '0';
                        
                        setTimeout(() => {
                            overlay.remove();
                            // Restore selection screen elements for next time
                            if (drawer) drawer.style.transform = 'translateX(0)';
                            if (title) title.style.display = 'block';
                            if (backBtn) backBtn.style.display = 'block';
                            if (selTeam) selTeam.style.opacity = '1';
                        }, 800);
                    }, 2500);
                }, 800);
            }, 100);
        }

        function renderMap() {
            const bgElement = document.getElementById('map-bg');
            if (bgElement && currentRun.arcId) bgElement.style.backgroundImage = getMapBackground(currentRun.arcId);

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

        window.updateTeamUI = function() {
            if (currentRun && currentRun.arcId) {
                const bgEl = document.getElementById('team-arena-bg');
                if (bgEl) {
                    bgEl.style.backgroundImage = getMapBackground(currentRun.arcId);
                }
            }
            
            // Update Party Slots
            for (let i = 0; i < 4; i++) {
                const slot = document.getElementById('team-party-slot-' + i);
                if (!slot) continue;
                const m = currentRun.party[i];
                if (m) {
                    slot.classList.add('filled');
                    slot.classList.add('combatant');
                    
                    const hpPerc = Math.max(0, Math.min(100, (m.currentHp / m.hp) * 100));
                    let hpColor = hpPerc > 50 ? '#22c55e' : hpPerc > 25 ? '#eab308' : '#ef4444';
                    const elementIcon = getElementIcon(m.type);
                    
                    slot.innerHTML = `
                        <div draggable="true" ondragstart="dragStartTeam(event, ${i})" style="width:100%; height:100%; position: absolute; top:0; left:0; z-index: 20; cursor:grab;"></div>
                        <div class="monster-art-container" style="pointer-events: none;">
                            <div class="art-content" style="position: relative;">
                                ${m.art.includes('.png') ? `<img src="${m.art}" draggable="false" />` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${m.art}</div>`}
                            </div>
                            <div class="shadow-ellipse"></div>
                        </div>
                        <div class="stats-container" style="position: relative; padding-top: 10px; z-index: 10; width: 100%; box-sizing: border-box; pointer-events: none;">
                            <div class="type-icon-container" style="position: absolute; top: -10px; right: -10px; z-index: 11;">
                                <img src="${elementIcon}" style="width: 24px; height: 24px; filter: drop-shadow(0px 0px 2px #000);" alt="${m.type}" />
                            </div>
                            <div class="name" style="text-align: center; color: white; font-weight: bold; font-size: 14px; text-shadow: 1px 1px 2px black; margin-bottom: 4px;">
                                ${m.name}
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                                <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 10px; background: #222; border-radius: 5px; overflow: hidden;">
                                    <div class="hp-fill" style="width:${hpPerc}%; background-color:${hpColor};"></div>
                                    <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px black; pointer-events: none;">
                                        ${Math.ceil(m.currentHp)}/${m.hp}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/EN.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="EN" />
                                <div class="energy-blocks" style="display: flex; gap: 4px; flex: 1;">
                                    ${Array.from({length: 3}).map((_, idx) => `<div style="flex: 1; height: 6px; background-color: ${idx < 1 ? '#00a8ff' : '#222'}; border-radius: 2px;"></div>`).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    slot.innerHTML = '';
                    slot.classList.remove('filled');
                    slot.classList.remove('combatant');
                }
            }
            
            // Render Stats grid
            const statsGrid = document.getElementById('team-stats-grid');
            if (statsGrid) {
                statsGrid.innerHTML = '';
                currentRun.party.forEach((m, idx) => {
                    if (!m) return;
                    
                    const btn = document.createElement('div');
                    btn.className = 'collection-square';
                    
                    btn.style.width = '100%'; btn.style.aspectRatio = '1 / 1'; btn.style.height = 'auto';
                    btn.style.position = 'relative';
                    
                    const types = (Array.isArray(m.type) ? m.type : [m.type]).filter(Boolean);
                    const typeHtml = types.map(t => {
                        const icon = getElementIcon(t);
                        return icon ? `<img src="${icon}" style="width:36px; height:36px; filter: drop-shadow(1px 1px 2px black);" alt="${t}" title="${t}" />` : `<div class="type-tag type-${t.toLowerCase()}" style="font-size: 14px; padding: 4px 8px;">${t}</div>`;
                    }).join('');
                    
                    btn.innerHTML = `
                        <div style="height:200px; display:flex; justify-content:center; align-items:center; margin-bottom:10px;">${renderArt(m.art, 160)}</div>
                        <strong style="font-size: 24px; text-shadow: 1px 1px 2px black;">${m.name}</strong>
                        <div style="display: flex; flex-direction: column; width: 100%; padding: 0 10px; margin-top: 10px;">
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                                <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 12px; background: #222; border-radius: 6px; overflow: hidden; border: 1px solid #000;">
                                    <div class="hp-fill" style="height: 100%; width:${Math.max(0, Math.min(100, (m.currentHp / m.hp) * 100))}%; background-color:${(m.currentHp / m.hp) * 100 > 50 ? '#22c55e' : (m.currentHp / m.hp) * 100 > 25 ? '#eab308' : '#ef4444'};"></div>
                                    <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; text-shadow: 1px 1px 2px black; pointer-events: none;">
                                        ${Math.ceil(m.currentHp)}/${m.hp}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/EN.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="EN" />
                                <div class="energy-blocks" style="display: flex; gap: 4px; flex: 1;">
                                    ${Array.from({length: 3}).map((_, idx) => `<div style="flex: 1; height: 8px; background-color: ${idx < (m.startingEnergy !== undefined ? m.startingEnergy : 1) ? '#00a8ff' : '#222'}; border-radius: 2px; border: 1px solid #000;"></div>`).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="position: absolute; top: 10px; right: 10px; display:flex; gap: 5px;">${typeHtml}</div>
                    `;
                    
                    btn.onclick = () => openCollectionDetails(m, true, false);
                    statsGrid.appendChild(btn);
                });
            }
        }

        window.openMapTeamModal = function() {
            updateTeamUI();
            showScreen('screen-team');
        }

        window.closeTeamScreen = function() {
            showScreen('screen-map');
            renderMap();
        }

        window.dragStartTeam = function(ev, index) {
            ev.dataTransfer.setData("index", index);
        }

        window.dropTeamParty = function(ev) {
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
            
            updateTeamUI();
        }

        function updateMapPartyUI() {
            for (let i = 0; i < 4; i++) {
                const slot = document.getElementById(`map-party-slot-${i}`);
                if (!slot) continue;
                const m = currentRun.party[i];
                if (m) {
                    slot.innerHTML = `
                        <div draggable="true" ondragstart="dragStartMap(event, ${i})" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:grab;">
                            <div style="width:140px; height:140px; margin-bottom:5px; pointer-events:none;">
                                ${renderArt(m.art, 120)}
                            </div>
                            <strong style="font-size:18px; text-align:center; pointer-events:none;">${m.name}</strong>
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