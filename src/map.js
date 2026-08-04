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
            logo.style.width = '900px';
            logo.style.maxWidth = '95vw';
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
            const screenMap = document.getElementById('screen-map');
            if (screenMap && currentRun.arcId) {
                // Remove background from screenMap
                screenMap.style.background = 'none';
            }

            const trackImg = document.getElementById('map-track-img');
            if (trackImg && currentRun.arcId) {
                let bgPath = getMapRoadBackground(currentRun.arcId);
                // Extract url path from url('...')
                let match = bgPath.match(/url\('?([^']*)'?\)/);
                if (match && match[1]) {
                    trackImg.src = match[1];
                }
            }

            const titleEl = document.getElementById('map-title');
            if (titleEl && currentRun.arcId) titleEl.innerText = getMapRoadName(currentRun.arcId);

            const container = document.getElementById('map-nodes-container');
            if (!container) return;
            container.innerHTML = '';

            // Node marker positions (fraction of track image width/height), read off the
            // red dots baked into each road art asset. One set per arc since each road
            // image lays its path out differently.
            const MAP_NODE_POSITIONS_BY_ARC = {
                arc1: [
                    { x: 0.07698, y: 0.50275 },
                    { x: 0.16330, y: 0.56714 },
                    { x: 0.24490, y: 0.40286 },
                    { x: 0.32545, y: 0.45275 },
                    { x: 0.40386, y: 0.57145 },
                    { x: 0.51187, y: 0.49178 },
                    { x: 0.61466, y: 0.35463 },
                    { x: 0.71960, y: 0.46944 },
                    { x: 0.81806, y: 0.51389 },
                    { x: 0.94860, y: 0.48263 }
                ],
                arc2: [
                    { x: 0.08294, y: 0.62932 },
                    { x: 0.18477, y: 0.70001 },
                    { x: 0.27376, y: 0.48857 },
                    { x: 0.34461, y: 0.45513 },
                    { x: 0.42433, y: 0.67481 },
                    { x: 0.52448, y: 0.56065 },
                    { x: 0.60463, y: 0.57761 },
                    { x: 0.71308, y: 0.60802 },
                    { x: 0.81641, y: 0.68874 },
                    { x: 0.92580, y: 0.67183 }
                ],
                arc3: [
                    { x: 0.07067, y: 0.60459 },
                    { x: 0.17811, y: 0.68241 },
                    { x: 0.26188, y: 0.41304 },
                    { x: 0.34522, y: 0.52422 },
                    { x: 0.41929, y: 0.62152 },
                    { x: 0.49569, y: 0.44098 },
                    { x: 0.59891, y: 0.42392 },
                    { x: 0.68919, y: 0.43800 },
                    { x: 0.77485, y: 0.61580 },
                    { x: 0.90958, y: 0.61578 }
                ]
            };

            const MAP_NODE_POSITIONS = MAP_NODE_POSITIONS_BY_ARC[currentRun.arcId] || MAP_NODE_POSITIONS_BY_ARC.arc1;

            currentRun.nodes.forEach((n, i) => {
                const pos = MAP_NODE_POSITIONS[i] || { x: 0.5, y: 0.5 };
                const nodeWrapper = document.createElement('div');
                nodeWrapper.className = 'node-container';
                nodeWrapper.style.position = 'absolute';
                nodeWrapper.style.left = `${pos.x * 100}%`;
                nodeWrapper.style.top = `${pos.y * 100}%`;
                nodeWrapper.style.transform = 'translate(-50%, -50%)';
                nodeWrapper.style.display = 'flex';
                nodeWrapper.style.flexDirection = 'column';
                nodeWrapper.style.alignItems = 'center';
                
                

                const div = document.createElement('div');
                div.className = `node ${i === currentRun.nodeIndex ? 'active' : ''} ${i < currentRun.nodeIndex ? 'completed' : ''}`;
                let iconSrc = '';
                let nodeText = '';
                if (n.type === 'boss') {
                    iconSrc = 'Art/Boss_Icon.png';
                    nodeText = 'Boss';
                } else if (n.type === 'combat') {
                    iconSrc = 'Art/Fight_Icon.png';
                    nodeText = 'Battle';
                } else {
                    iconSrc = 'Art/Merge_Icon.png';
                    nodeText = 'Merge';
                }
                
                const isCompleted = i < currentRun.nodeIndex;
                const isActive = i === currentRun.nodeIndex;
                const isUpcoming = i > currentRun.nodeIndex;

                let filterStr = '';
                let textColor = 'white';

                if (isCompleted) {
                    filterStr = 'grayscale(100%) brightness(50%) drop-shadow(0 0 15px lime)';
                    textColor = '#22c55e'; // Green
                } else if (isActive) {
                    filterStr = 'drop-shadow(0 0 15px yellow)';
                    textColor = 'yellow';
                } else if (isUpcoming) {
                    // Upcoming nodes stay visible but dimmed, so the player's focus stays on
                    // the current node and the trail already fought through.
                    if (n.type === 'merge') {
                        filterStr = 'brightness(45%) drop-shadow(0 0 15px #3b82f6)';
                        textColor = '#3b82f6'; // Blue
                    } else {
                        filterStr = 'brightness(45%) drop-shadow(0 0 15px red)';
                        textColor = 'red';
                    }
                }

                div.innerHTML = `
                    <div style="position:absolute; top:-35px; left:50%; transform:translateX(-50%); color:${textColor}; font-size:24px; font-weight:bold; text-shadow:2px 2px 2px black, 0 0 5px black; white-space:nowrap; z-index:10;">${nodeText}</div>
                    <img src="${iconSrc}" style="width: 80%; height: 80%; object-fit: contain; filter: ${filterStr}; transition: filter 0.3s;" />
                `;
                div.style.background = 'transparent';
                div.style.border = 'none';
                div.style.boxShadow = 'none';
                div.style.width = '120px';
                div.style.height = '120px';
                div.style.transform = isActive ? 'scale(1.2)' : 'scale(1)';

                nodeWrapper.appendChild(div);

                container.appendChild(nodeWrapper);
            });
            
            document.getElementById('btn-continue-node').disabled = currentRun.nodeIndex >= currentRun.nodes.length;

            // Auto-scroll to current node
            setTimeout(() => {
                const mapNodes = document.getElementById('map-nodes');
                const track = document.getElementById('map-track');
                if (mapNodes && track) {
                    const viewportWidth = mapNodes.offsetWidth;
                    const trackWidth = track.offsetWidth || (mapNodes.offsetHeight * (3240 / 540));
                    
                    const pos = MAP_NODE_POSITIONS[currentRun.nodeIndex] || { x: 0.5 };
                    let targetX = pos.x * trackWidth;
                    
                    // Center the targetX in the viewport
                    // Center the targetX in the viewport
                    let scrollLeft = targetX - (viewportWidth / 2);
                    
                    // Clamp it so we don't scroll past the edges
                    scrollLeft = Math.max(0, Math.min(trackWidth - viewportWidth, scrollLeft));
                    
                    mapNodes.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            }, 100);

            updateTeamUI();
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
                    const mEnergy = m.energy !== undefined ? m.energy : (m.startingEnergy !== undefined ? m.startingEnergy : 1);
                    const elementIcon = getElementIcon(m.type);
                    
                    slot.innerHTML = `
                        <div draggable="true" ondragstart="dragStartTeam(event, ${i})" style="width:100%; height:100%; position: absolute; top:0; left:0; z-index: 20; cursor:grab;"></div>
                        <div class="monster-art-container" style="pointer-events: none;">
                            <div class="art-content" style="position: relative;">
                                ${m.art.includes('.png') ? `<img src="${m.art}" draggable="false" />` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${m.art}</div>`}
                            </div>
                            <div class="shadow-ellipse ${getShadowClass(m.name)}"></div>
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
                                    ${(m.isBoss ? [1,2,3,4,5] : [1,2,3]).map(i => `<div style="flex: 1; height: 6px; background-color: ${mEnergy >= i ? '#00a8ff' : '#222'}; border-radius: 2px;"></div>`).join('')}
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
                const visualOrder = [2, 0, 3, 1];
                visualOrder.forEach(idx => {
                    const m = currentRun.party[idx];
                    const btn = document.createElement('div');
                    btn.className = 'collection-square';
                    btn.style.aspectRatio = 'auto'; 
                    btn.style.height = '100%';
                    btn.style.width = '100%';
                    btn.style.position = 'relative';
                    btn.style.minHeight = '0';
                    btn.style.minWidth = '0';
                    btn.style.overflow = 'hidden';
                    
                    if (!m) {
                        btn.style.opacity = '0.3';
                        btn.style.border = '2px dashed #444';
                        btn.style.background = 'transparent';
                        btn.style.pointerEvents = 'none';
                        statsGrid.appendChild(btn);
                        return;
                    }
                    
                    const types = (Array.isArray(m.type) ? m.type : [m.type]).filter(Boolean);
                    const typeHtml = types.map(t => {
                        const icon = getElementIcon(t);
                        return icon ? `<img src="${icon}" style="width:36px; height:36px; filter: drop-shadow(1px 1px 2px black);" alt="${t}" title="${t}" />` : `<div class="type-tag type-${t.toLowerCase()}" style="font-size: 14px; padding: 4px 8px;">${t}</div>`;
                    }).join('');
                    
                    btn.innerHTML = `
                        <div class="monster-art" style="flex: 1; min-height: 0; display:flex; justify-content:center; align-items:center; margin-bottom:5px;">${renderArt(m.art, 120)}</div>
                        <strong style="font-size: 20px; text-shadow: 1px 1px 2px black; margin-bottom: 5px;">${m.name}</strong>
                        <div style="display: flex; flex-direction: column; width: 100%; padding: 0 10px; margin-top: auto;">
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
                                    ${(m.isBoss ? [1,2,3,4,5] : [1,2,3]).map(i => `<div style="flex: 1; height: 8px; background-color: ${(m.energy !== undefined ? m.energy : (m.startingEnergy !== undefined ? m.startingEnergy : 1)) >= i ? '#00a8ff' : '#222'}; border-radius: 2px; border: 1px solid #000;"></div>`).join('')}
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

        
        

window.proceedToNode = function() {
    if (!currentRun || currentRun.nodeIndex >= currentRun.nodes.length) return;
    const node = currentRun.nodes[currentRun.nodeIndex];
    if (node.type === 'combat' || node.type === 'boss') {
        if (typeof initCombat === 'function') initCombat(node);
    } else if (node.type === 'merge') {
        if (typeof initMerge === 'function') initMerge();
    }
}
