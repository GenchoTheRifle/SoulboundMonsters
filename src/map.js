// --- RUN ENGINE ---
        // Hints shown on a loading bar before each run starts. One is picked at random (never the same one twice in a row).
        const RUN_TIPS = [
            'Merge at every merge stage. You can merge more than once.',
            "HP doesn't recover between fights. Protect it.",
            'Energy carries over. Basic Attack tops it up (+1).',
            'The boss is the last fight. Spend all your energy!',
            'Defeating an enemy gives +1 energy.',
            'Beast beats Nature, Nature beats Mech, Mech beats Beast.',
            'Melee only hits the front row. Ranged hits anyone.',
            'Higher SPD means more turns. Watch the turn order.',
            'Recruit with merges in mind. Check the Collection.',
            'Guard stays up until it absorbs a hit.',
            'Counter reflects a hit back, along with any stun or poison.',
            "Poison ticks at the start of the victim's turn.",
            'Rearrange your party on the team screen between fights.',
            'A full party sends new recruits to your backpack. Swap them in on the team screen.',
            'The node before the boss lets you merge and set your formation one last time.'
        ];
        const RUN_TIP_MS = 3600;   // how long the loading bar / tip stays up
        let lastRunTipIndex = -1;
        function pickRunTip() {
            let i;
            do { i = Math.floor(Math.random() * RUN_TIPS.length); } while (i === lastRunTipIndex && RUN_TIPS.length > 1);
            lastRunTipIndex = i;
            return RUN_TIPS[i];
        }

        function startRun() {
            SFX.play('enterMap');   // battle horn as the run begins
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
            actText.style.fontWeight = 'normal';
            actText.style.letterSpacing = '10px';
            actText.style.marginTop = '40px';
            actText.style.textShadow = 'var(--outline-thick)';
            actText.style.opacity = '0';
            actText.style.transition = 'opacity 1s ease-in-out 0.5s';
            overlay.appendChild(actText);

            // Loading bar + tip, shown first (same blue look as the tutorial's boot screen); it fades out before the act title appears.
            const tipBox = document.createElement('div');
            tipBox.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:26px; opacity:0; transition:opacity 0.5s ease; pointer-events:none;';
            const tipLabel = document.createElement('div');
            tipLabel.innerText = 'TIP';
            tipLabel.style.cssText = 'font-size:30px; letter-spacing:10px; color:#cfe6ff; text-shadow:0 0 18px rgba(80,160,255,0.9), var(--outline-med);';
            const tipText = document.createElement('div');
            tipText.innerText = pickRunTip();
            tipText.className = 'move-description-text';
            tipText.style.cssText = 'font-size:34px; color:#fff; text-align:center; max-width:85vw; text-shadow:var(--outline-med);';
            const tipBar = document.createElement('div');
            tipBar.style.cssText = 'width:min(620px, 70vw); height:14px; border:2px solid rgba(160,210,255,0.8); border-radius:8px; overflow:hidden; box-shadow:0 0 16px rgba(80,160,255,0.6);';
            const tipBarFill = document.createElement('div');
            tipBarFill.style.cssText = `width:0; height:100%; background:linear-gradient(90deg, #4aa3ff, #e0f0ff); box-shadow:0 0 14px #8cc8ff; transition:width ${RUN_TIP_MS - 300}ms cubic-bezier(0.3, 0.1, 0.3, 1);`;
            tipBar.appendChild(tipBarFill);
            tipBox.append(tipLabel, tipText, tipBar);
            overlay.appendChild(tipBox);

            document.body.appendChild(overlay);

            // Resolves once the black transition overlay has fully faded out and been
            // removed, so combat can set itself up in the background but must not let
            // a faster enemy act until the player can actually see the arena.
            let resolveOverlayGone;
            const overlayGone = new Promise(resolve => { resolveOverlayGone = resolve; });

            // Start animation sequence
            setTimeout(() => {
                overlay.style.opacity = '1';

                setTimeout(() => {
                    // Loading bar fills while a tip is shown (the act title follows once it has faded)
                    tipBox.style.opacity = '1';
                    void tipBar.offsetWidth;
                    tipBarFill.style.width = '100%';

                    // Initialize run state in the background while black screen is up
                    currentRun.party = selectionSlots.map(s => s ? { ...s, currentHp: s.hp } : null);
                    resetBackpack();
                    currentRun.arcId = selectedArcId;
                    currentRun.nodeIndex = 0;
                    // Node 1's enemy pool is restricted to the base starters only on the
                    // player's very first ever run, since that's the only time they're
                    // guaranteed to have just 2 starters unlocked.
                    currentRun.isFirstRun = !gameState.hasStartedFirstRun;
                    gameState.hasStartedFirstRun = true;
                    saveGame();
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
                    initCombat(currentRun.nodes[0], { deferStart: overlayGone });

                    const drawer = document.getElementById('selection-drawer');
                    if (drawer) drawer.style.transform = 'translateX(100%)';
                    
                    const title = document.querySelector('#screen-selection h2');
                    const backBtn = document.querySelector('#screen-selection > button');
                    if (title) title.style.display = 'none';
                    if (backBtn) backBtn.style.display = 'none';
                    const selTeam = document.getElementById('selection-player-team');
                    if (selTeam) selTeam.style.opacity = '0';
                    
                    // When the bar is full the tip fades away, then the act title appears as before
                    setTimeout(() => {
                        tipBox.style.opacity = '0';
                        setTimeout(() => {
                            logo.style.transform = 'translateY(0)';
                            logo.style.opacity = '1';
                            actText.style.opacity = '1';
                        }, 500);
                    }, RUN_TIP_MS);

                    // Fade out (after the tip phase and the act title have had their time)
                    setTimeout(() => {
                        overlay.style.opacity = '0';
                        
                        setTimeout(() => {
                            overlay.remove();
                            // Restore selection screen elements for next time
                            if (drawer) drawer.style.transform = 'translateX(0)';
                            if (title) title.style.display = 'block';
                            if (backBtn) backBtn.style.display = 'block';
                            if (selTeam) selTeam.style.opacity = '1';
                            resolveOverlayGone();
                        }, 800);
                    }, RUN_TIP_MS + 500 + 2500);
                }, 800);
            }, 100);
        }

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

        function getMapNodePositions(arcId) {
            return MAP_NODE_POSITIONS_BY_ARC[arcId] || MAP_NODE_POSITIONS_BY_ARC.arc1;
        }

        // Little party-lead marker standing on a map node (normal and tutorial maps alike).
        function buildMapToken(monster, left, top) {
            const token = document.createElement('div');
            token.id = 'map-token';
            token.className = 'map-token';
            token.style.left = left;
            token.style.top = top;
            token.innerHTML = `
                <div class="map-token-ring"></div>
                <div class="map-token-shadow"></div>
                <div class="map-token-bob"><img src="${monster.art}" draggable="false" /></div>`;
            return token;
        }

        // Hops the token over to another node position; resolves once it has landed.
        function moveMapToken(left, top) {
            const token = document.getElementById('map-token');
            if (!token) return Promise.resolve();
            token.classList.remove('landed');
            token.classList.add('moving');
            token.style.left = left;
            token.style.top = top;
            return new Promise(resolve => setTimeout(() => {
                token.classList.remove('moving');
                token.classList.add('landed');
                setTimeout(resolve, 300);
            }, 1000));
        }

        // Extra points the path line passes through between two nodes so it hugs the road's actual
        // windings (bridges, stairs, floor corners) rather than just joining the node dots. Keyed by
        // arc, then by the segment's starting node index. Pixel coords in the 3240x540 road image.
        const MAP_ROAD_REF_SIZE = { w: 3240, h: 540 };
        const MAP_ROAD_WAYPOINTS_BY_ARC = {
            arc1: {
                0: [[309, 291], [369, 304], [429, 301]],
                1: [[589, 311], [649, 305], [709, 277]],
                2: [[853, 205], [913, 204], [973, 221]],
                3: [[1114, 266], [1174, 287], [1234, 301]],
                4: [[1369, 307], [1429, 301], [1489, 284], [1549, 271], [1609, 266]],
                5: [[1718, 263], [1778, 252], [1838, 235], [1898, 218]],
                6: [[2051, 194], [2111, 202], [2171, 215], [2231, 234]],
                7: [[2392, 275], [2452, 295], [2512, 297], [2572, 296]],
                8: [[2760, 274], [2870, 270], [2970, 265]]
            },
            arc2: {
                0: [[329, 365], [389, 382], [449, 401], [509, 396]],
                1: [[659, 376], [719, 365], [779, 341], [839, 294]],
                2: [[947, 249], [1007, 241], [1067, 239]],
                3: [[1177, 277], [1237, 327], [1297, 356]],
                4: [[1435, 366], [1495, 363], [1555, 342], [1615, 319]],
                5: [[1759, 302], [1819, 296], [1879, 301]],
                6: [[2019, 334], [2079, 351], [2139, 340], [2199, 333], [2259, 329]],
                7: [[2370, 333], [2430, 344], [2490, 358], [2550, 369]],
                8: [[2740, 382], [2850, 378], [2930, 370]]
            },
            arc3: {
                0: [[310, 360], [400, 382], [490, 383]],
                1: [[640, 350], [705, 322], [775, 276]],
                2: [[908, 212], [968, 218], [1028, 250]],
                3: [[1179, 306], [1239, 330], [1299, 336]],
                4: [[1418, 330], [1478, 312], [1538, 266]],
                5: [[1666, 228], [1726, 225], [1786, 237], [1846, 235]],
                6: [[2000, 227], [2060, 227], [2120, 223], [2180, 227]],
                7: [[2293, 258], [2353, 285], [2413, 313]],
                8: [[2571, 342], [2631, 349], [2691, 352], [2751, 343], [2811, 344], [2871, 341]]
            }
        };

        // Smooth curve through every node plus the road waypoints between them (Catmull-Rom spline
        // converted to cubic Beziers). Returns one SVG path 'd' per node-to-node segment.
        function buildMapRoadSegments(arcId, nodePts, w, h) {
            const wps = MAP_ROAD_WAYPOINTS_BY_ARC[arcId] || {};
            const sx = w / MAP_ROAD_REF_SIZE.w, sy = h / MAP_ROAD_REF_SIZE.h;
            const full = [];
            const segStart = [];
            nodePts.forEach((p, i) => {
                segStart.push(full.length);
                full.push(p);
                if (i < nodePts.length - 1) (wps[i] || []).forEach(q => full.push({ x: q[0] * sx, y: q[1] * sy }));
            });
            const t = 1 / 6;
            const bez = j => {
                const p0 = full[Math.max(j - 1, 0)], p1 = full[j], p2 = full[j + 1], p3 = full[Math.min(j + 2, full.length - 1)];
                const c1 = { x: p1.x + (p2.x - p0.x) * t, y: p1.y + (p2.y - p0.y) * t };
                const c2 = { x: p2.x - (p3.x - p1.x) * t, y: p2.y - (p3.y - p1.y) * t };
                return ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
            };
            const segs = [];
            for (let i = 0; i < nodePts.length - 1; i++) {
                let d = `M ${nodePts[i].x} ${nodePts[i].y}`;
                for (let j = segStart[i]; j < segStart[i + 1]; j++) d += bez(j);
                segs.push(d);
            }
            return segs;
        }

        // Path lines between nodes, same style as the tutorial map: solid behind the party,
        // marching dashes to the next stage, faint dashes beyond. Drawn in the road image's own
        // pixel space so they stay pinned to the nodes however the track scales.
        function drawMapTrackPath(positions) {
            const svg = document.getElementById('map-track-path');
            const trackImg = document.getElementById('map-track-img');
            if (!svg || !trackImg) return;
            const draw = () => {
                const w = trackImg.naturalWidth || 3240;
                const h = trackImg.naturalHeight || 540;
                svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
                const at = currentRun.nodeIndex - 1; // the node the party is standing on
                // Node positions in the road image's pixel space.
                const pts = positions.slice(0, currentRun.nodes.length).map(p => ({ x: p.x * w, y: p.y * h }));
                const segs = buildMapRoadSegments(currentRun.arcId, pts, w, h);
                let paths = '';
                segs.forEach((d, i) => {
                    const state = i < at ? 'done' : (i === at ? 'next' : 'todo');
                    paths += `<path class="map-path map-path-${state}" d="${d}" />`;
                });
                svg.innerHTML = paths;
            };
            draw();
            if (!trackImg.complete) trackImg.addEventListener('load', draw, { once: true });
        }

        let mapTravelBusy = false;

        function renderMap() {
            if (currentRun.isTutorial) {
                renderTutorialMap();
                return;
            }
            const screenMap = document.getElementById('screen-map');
            if (screenMap) screenMap.classList.remove('tutorial-mode');
            // Picks which set of table props (cave / forest / lab) is shown around the map.
            if (screenMap && currentRun.arcId) screenMap.dataset.arc = currentRun.arcId;
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

            const MAP_NODE_POSITIONS = getMapNodePositions(currentRun.arcId);
            drawMapTrackPath(MAP_NODE_POSITIONS);

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
                    ${isActive ? `<div class="node-active-arrow">&#9660;</div>` : ''}
                    ${n.type === 'boss' && !isActive ? `<div class="boss-merge-tell"><img src="Art/Merge_Icon.png" alt="" /><span>&#9660;</span></div>` : ''}
                    ${i === currentRun.nodeIndex - 1 ? '' : `<div style="position:absolute; top:-35px; left:50%; transform:translateX(-50%); color:${textColor}; font-size:24px; font-weight: normal; text-shadow:var(--outline-med); white-space:nowrap; z-index:10;">${nodeText}</div>`}
                    <img src="${iconSrc}" style="width: 80%; height: 80%; object-fit: contain; filter: ${filterStr}; transition: filter 0.3s;" />
                    ${isCompleted ? `<img src="Art/Victory.png" style="position:absolute; top:0; right:0; width: 36%; height: 36%; object-fit: contain; filter: drop-shadow(1px 1px 2px black); z-index: 11;" />` : ''}
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

            // The party lead stands on the last cleared node and hops to the next one on CONTINUE.
            const lead = currentRun.party.find(Boolean);
            const leadPos = MAP_NODE_POSITIONS[currentRun.nodeIndex - 1];
            if (lead && leadPos) {
                container.appendChild(buildMapToken(lead, `${leadPos.x * 100}%`, `${leadPos.y * 100}%`));
            }

            document.getElementById('btn-continue-node').disabled = currentRun.nodeIndex >= currentRun.nodes.length;

            renderMapScrollMarks(MAP_NODE_POSITIONS);
            if (trackImg) trackImg.addEventListener('load', updateMapScrollbar, { once: true });

            // Auto-scroll to current node. The track image can still be mid-decode here
            // (its src was just (re)assigned above), so map-track's layout width isn't
            // reliable yet - relying on a fixed delay alone meant the scroll would sometimes
            // run before the image finished loading, fall back to a guessed width, and land
            // on the wrong part of the road. Re-run once the image actually finishes loading
            // so the current node is always the one brought into view.
            const scrollToCurrentNode = () => {
                const mapNodes = document.getElementById('map-nodes');
                const track = document.getElementById('map-track');
                if (mapNodes && track) {
                    const viewportWidth = mapNodes.offsetWidth;
                    const fallbackWidth = trackImg && trackImg.naturalWidth
                        ? mapNodes.offsetHeight * (trackImg.naturalWidth / trackImg.naturalHeight)
                        : mapNodes.offsetHeight * (3240 / 540);
                    const trackWidth = track.offsetWidth || fallbackWidth;

                    const pos = MAP_NODE_POSITIONS[currentRun.nodeIndex] || { x: 0.5 };
                    let targetX = pos.x * trackWidth;

                    // Center the targetX in the viewport
                    let scrollLeft = targetX - (viewportWidth / 2);

                    // Clamp it so we don't scroll past the edges
                    scrollLeft = Math.max(0, Math.min(trackWidth - viewportWidth, scrollLeft));

                    mapNodes.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            };

            if (trackImg && !trackImg.complete) {
                trackImg.addEventListener('load', scrollToCurrentNode, { once: true });
            }
            setTimeout(scrollToCurrentNode, 100);

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
                    let hpColor = hpPerc > 66 ? '#22c55e' : hpPerc > 33 ? '#eab308' : '#ef4444';
                    const mEnergy = m.energy !== undefined ? m.energy : (m.startingEnergy !== undefined ? m.startingEnergy : 1);

                    slot.innerHTML = `
                        <div draggable="true" ondragstart="dragStartTeam(event, ${i})" style="width:100%; height:100%; position: absolute; top:0; left:0; z-index: 20; cursor:grab;"></div>
                        <div class="monster-art-container" style="pointer-events: none;">
                            <div class="art-content" style="position: relative;">
                                ${m.art.includes('.png') ? `<img src="${m.art}" draggable="false" />` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${m.art}</div>`}
                            </div>
                            <div class="shadow-ellipse ${getShadowClass(m.name)}"></div>
                        </div>
                        <div class="stats-container" style="position: relative; padding-top: 10px; z-index: 10; width: 100%; box-sizing: border-box; pointer-events: none;">
                            <div class="type-icon-container" style="position: absolute; top: -10px; right: -10px; z-index: 11; filter: drop-shadow(0px 0px 2px #000);">
                                ${getTypeIconHtml(m.type, 40)}
                            </div>
                            <div class="name" style="text-align: center; color: white; font-weight: normal; font-size: 20px; text-shadow: var(--outline-med); margin-bottom: 4px;">
                                ${m.name}
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                                <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 15px; background: #222; border-radius: 6px; overflow: hidden;">
                                    <div class="hp-fill" style="width:${hpPerc}%; background-color:${hpColor};"></div>
                                    <div class="hp-text move-description-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; pointer-events: none;">
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
            renderBackpack('team');

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
                        <div class="monster-art" style="flex: 1; min-height: 0; min-width: 0; width: 100%; display:flex; justify-content:center; align-items:center; margin-bottom:5px; overflow:hidden;">${m.art.includes('.png') ? `<img src="${m.art}" style="max-width:100%; max-height:100%; object-fit:contain; image-rendering: pixelated;" draggable="false" />` : `<div style="font-size:100px; line-height:1;">${m.art}</div>`}</div>
                        <strong style="font-size: 26px; color: #fff; text-shadow: var(--outline-med); margin-bottom: 5px;">${m.name}</strong>
                        <div style="display: flex; flex-direction: column; width: 100%; padding: 0 10px; margin-top: auto;">
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                                <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 17px; background: #222; border-radius: 6px; overflow: hidden; border: 1px solid #000;">
                                    <div class="hp-fill" style="height: 100%; width:${Math.max(0, Math.min(100, (m.currentHp / m.hp) * 100))}%; background-color:${(m.currentHp / m.hp) * 100 > 66 ? '#22c55e' : (m.currentHp / m.hp) * 100 > 33 ? '#eab308' : '#ef4444'};"></div>
                                    <div class="hp-text move-description-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; pointer-events: none;">
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
            ev.dataTransfer.setData("source", "party");
            ev.dataTransfer.setData("index", index);
        }

        // Party slots and backpack slots both accept drops from either list (swap).
        window.dropTeamParty = function(ev) { dropIntoSlot(ev, 'party', updateTeamUI); }
        window.dropTeamBackpack = function(ev) { dropIntoSlot(ev, 'backpack', updateTeamUI); }

        
        

window.proceedToNode = function() {
    if (currentRun && currentRun.isTutorial) {
        tutorialProceed();
        return;
    }
    if (!currentRun || currentRun.nodeIndex >= currentRun.nodes.length || mapTravelBusy) return;
    const node = currentRun.nodes[currentRun.nodeIndex];
    const pos = getMapNodePositions(currentRun.arcId)[currentRun.nodeIndex] || { x: 0.5, y: 0.5 };
    mapTravelBusy = true;
    SFX.play(currentRun.arcId === 'arc2' ? 'travelForest' : 'travel');   // footsteps: grass in the forest act, stone elsewhere
    document.getElementById('btn-continue-node').disabled = true;
    moveMapToken(`${pos.x * 100}%`, `${pos.y * 100}%`).then(() => {
        fadeThroughBlack(() => {
            mapTravelBusy = false;
            if (node.type === 'boss') {
                // one last chance to merge and fix the formation before the boss (see finishMerge)
                initMerge({ lastChanges: node });
            } else if (node.type === 'combat') {
                if (typeof initCombat === 'function') initCombat(node);
            } else if (node.type === 'merge') {
                if (typeof initMerge === 'function') initMerge();
            }
        });
    });
}

// --- MAP TABLE PROPS (decor around the road map: compass lid, candle flame, flippable coin) ---
document.addEventListener('click', (e) => {
    const target = e.target && e.target.closest ? e.target.closest('#map-props [data-prop]') : null;
    if (!target) return;
    const props = document.getElementById('map-props');
    const propSounds = { compass: 'compass', candle: 'candle', coin: 'coin', mushroom: 'mushroom', valve: 'valve', scrap: 'scrap', vial: 'vial', leaf: 'leaf', 'btn-green': 'buttonPress', 'btn-red': 'buttonPress' };
    SFX.play(propSounds[target.dataset.prop] || 'click');
    switch (target.dataset.prop) {
        case 'compass':
            props.querySelector('.prop-compass').classList.toggle('open');
            break;
        case 'candle':
            props.classList.toggle('candle-out');
            break;
        case 'coin': {
            if (target.classList.contains('flipping')) break;
            target.classList.add('flipping');
            // swap faces while the coin is edge-on
            setTimeout(() => target.classList.toggle('flipped'), 275);
            setTimeout(() => target.classList.remove('flipping'), 550);
            break;
        }
        case 'mushroom':
            restartMapPropClass(props.querySelector('.prop-mushroom'), 'puff', 4000);
            break;
        case 'leaf':
            props.querySelector('.prop-leaves').classList.toggle('leaf-moved');
            break;
        case 'vial':
            props.classList.toggle('vial-spilled');
            break;
        case 'btn-green':
        case 'btn-red':
            restartMapPropClass(target, 'pressed', 300);
            break;
        case 'valve':
            target._angle = (target._angle || 0) + 540;
            target.style.transform = `rotate(${target._angle}deg)`;
            break;
        case 'scrap':
            restartMapPropClass(props, 'scrap-pulse', 2300);
            break;
    }
});

// Adds a class, restarting its CSS animation if it is already running, and removes it after `ms`.
function restartMapPropClass(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls);
    void el.getBoundingClientRect();
    el.classList.add(cls);
    clearTimeout(el._propTimer);
    el._propTimer = setTimeout(() => el.classList.remove(cls), ms);
}

// --- ROAD SCROLLBAR (sits over the bottom of the map; shows where the boss is) ---
function updateMapScrollbar() {
    const nodes = document.getElementById('map-nodes');
    const bar = document.getElementById('map-scrollbar');
    const track = document.getElementById('map-scroll-track');
    const thumb = document.getElementById('map-scroll-thumb');
    if (!nodes || !bar || !track || !thumb) return;
    const max = nodes.scrollWidth - nodes.clientWidth;
    if (max <= 2) { bar.style.display = 'none'; return; }
    bar.style.display = 'block';
    const trackW = track.clientWidth;
    const thumbW = Math.max(40, trackW * nodes.clientWidth / nodes.scrollWidth);
    thumb.style.width = thumbW + 'px';
    thumb.style.left = (nodes.scrollLeft / max) * (trackW - thumbW) + 'px';
}

// One marker per node along the track: boss (red diamond), current (yellow), cleared (grey).
function renderMapScrollMarks(positions) {
    const marks = document.getElementById('map-scroll-marks');
    if (!marks || !currentRun || !currentRun.nodes) return;
    marks.innerHTML = '';
    currentRun.nodes.forEach((n, i) => {
        const pos = positions[i];
        if (!pos) return;
        const m = document.createElement('div');
        let cls = n.type === 'boss' ? 'boss' : (n.type === 'merge' ? 'merge' : 'combat');
        if (i < currentRun.nodeIndex) cls = 'done';
        else if (i === currentRun.nodeIndex && n.type !== 'boss') cls = 'current';
        m.className = 'map-scroll-mark ' + cls;
        m.style.left = (pos.x * 100) + '%';
        marks.appendChild(m);
    });
    updateMapScrollbar();
}

(function initMapScrollbar() {
    const nodes = document.getElementById('map-nodes');
    const track = document.getElementById('map-scroll-track');
    const thumb = document.getElementById('map-scroll-thumb');
    if (!nodes || !track || !thumb) return;

    // The game is scaled with a CSS transform, so convert screen pixels to layout pixels.
    const scaleOf = () => (track.offsetWidth ? track.getBoundingClientRect().width / track.offsetWidth : 1);
    const jump = (left) => nodes.scrollTo({ left, behavior: 'instant' });

    nodes.addEventListener('scroll', updateMapScrollbar, { passive: true });
    window.addEventListener('resize', updateMapScrollbar);

    // Mouse wheel scrolls the road sideways.
    nodes.addEventListener('wheel', (e) => {
        if (nodes.scrollWidth <= nodes.clientWidth) return;
        e.preventDefault();
        nodes.scrollBy({ left: (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 1.5, behavior: 'instant' });
    }, { passive: false });

    // Drag the thumb.
    thumb.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        thumb.setPointerCapture(e.pointerId);
        thumb.classList.add('dragging');
        const startX = e.clientX;
        const startScroll = nodes.scrollLeft;
        const move = (ev) => {
            const trackW = track.clientWidth;
            const range = trackW - thumb.offsetWidth;
            const max = nodes.scrollWidth - nodes.clientWidth;
            if (range <= 0) return;
            jump(startScroll + ((ev.clientX - startX) / scaleOf()) * (max / range));
        };
        const up = () => {
            thumb.classList.remove('dragging');
            thumb.removeEventListener('pointermove', move);
            thumb.removeEventListener('pointerup', up);
            thumb.removeEventListener('pointercancel', up);
        };
        thumb.addEventListener('pointermove', move);
        thumb.addEventListener('pointerup', up);
        thumb.addEventListener('pointercancel', up);
    });

    // Click the track to jump there.
    track.addEventListener('pointerdown', (e) => {
        if (e.target !== track) return;
        const rect = track.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        nodes.scrollTo({ left: ratio * nodes.scrollWidth - nodes.clientWidth / 2, behavior: 'smooth' });
    });
})();

// --- MAP TABLE: one-off setup that keeps the map screen cheap to show -----------------------------
// 1) The parchment's ragged edge is a clip-path polygon (cheap) rather than an SVG displacement filter.
// 2) The table/paper textures are SVG images that run feTurbulence every time they are rasterised;
//    bake each one to a plain bitmap once so showing the map again is just a texture lookup.
(function initMapTableCosmetics() {
    const paper = document.getElementById('map-paper');
    if (paper) {
        let seed = 7;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        const jitter = () => 3 + rnd() * 5 + Math.sin(rnd() * 6.28) * 2;
        const pts = [];
        const H = 110, V = 60;
        for (let i = 0; i <= H; i++) pts.push(`${(i / H * 100).toFixed(2)}% ${jitter().toFixed(1)}px`);
        for (let i = 1; i <= V; i++) pts.push(`calc(100% - ${jitter().toFixed(1)}px) ${(i / V * 100).toFixed(2)}%`);
        for (let i = H - 1; i >= 0; i--) pts.push(`${(i / H * 100).toFixed(2)}% calc(100% - ${jitter().toFixed(1)}px)`);
        for (let i = V - 1; i > 0; i--) pts.push(`${jitter().toFixed(1)}px ${(i / V * 100).toFixed(2)}%`);
        paper.style.clipPath = `polygon(${pts.join(',')})`;
    }

    const bakeBackgrounds = async (el) => {
        if (!el) return;
        const bg = getComputedStyle(el).backgroundImage;
        const re = /url\("(data:image\/svg\+xml[^"]*)"\)/g;
        const found = [...bg.matchAll(re)];
        if (!found.length) return;
        let out = bg;
        for (const m of found) {
            try {
                const img = new Image();
                img.src = m[1];
                await img.decode();
                const w = img.naturalWidth || 512, h = img.naturalHeight || 512;
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
                if (blob) out = out.replace(m[0], `url("${URL.createObjectURL(blob)}")`);
            } catch (e) { /* keep the original SVG texture */ }
        }
        el.style.backgroundImage = out;
    };

    const run = () => { bakeBackgrounds(document.getElementById('map-table')).then(() => bakeBackgrounds(paper)); };
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 3000 }); else setTimeout(run, 1500);
})();
