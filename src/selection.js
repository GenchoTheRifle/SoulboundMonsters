// --- RUN SELECTION ---
        let draggedStarterId = null;
        let draggedFromSlot = null;
        let selectedArcId = null;

        // Starter portraits are 512x512 canvases where the monster is positioned differently
        // depending on its pose (grounded creatures sit low, flying ones float higher), leaving
        // uneven empty space around the art. These per-starter crop/zoom values (scale + focus
        // point as % of the image) recenter the art specifically for these "Available" selection
        // cards, without touching the source art or its use elsewhere. Values are measured from
        // each PNG's actual alpha bounding box (canvas pixel analysis), then scaled so every
        // starter's art covers the same visible area of its card (derived from Bat's wide
        // wingspan, the most edge-constrained pose) and shrunk further to leave room for the name.
        const STARTER_ART_FOCUS = {
            wolf: { scale: 0.90, cx: 49.3, cy: 77.1 },
            slime: { scale: 1.02, cx: 50.2, cy: 77.1 },
            sentry: { scale: 0.88, cx: 50.6, cy: 72.1 },
            bear: { scale: 0.89, cx: 49.6, cy: 73.7 },
            mushroom: { scale: 0.87, cx: 49.1, cy: 73.0 },
            sparkbot: { scale: 0.92, cx: 50.1, cy: 50.6 },
            bat: { scale: 0.83, cx: 50.2, cy: 46.9 },
            tree: { scale: 0.76, cx: 51.0, cy: 72.3 },
            mech_melee: { scale: 0.91, cx: 51.3, cy: 70.3 }
        };

        window.startArc = function(arcId) {
            selectedArcId = arcId;
            const bgElement = document.getElementById('selection-bg');
            if (bgElement) bgElement.style.backgroundImage = getMapBackground(arcId);
            showScreen('screen-selection');
        };

        function updateSelectionUI() {
            selectionSlots.forEach((s, i) => {
                const slot = document.getElementById(`slot-${i}`);
                if (!slot) return;
                if (s) {
                    slot.classList.add('filled');
                    slot.classList.add('combatant');
                    
                    
                    
                    const hpPerc = 100;
                    let hpColor = '#22c55e';
                    
                    slot.innerHTML = `
                        <div class="monster-art-container" style="pointer-events: none;">
                            <div class="art-content" style="position: relative;">
                                ${s.art.includes(".png") ? `<img src="${s.art}" draggable="false" />` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${s.art}</div>`}
                            </div>
                            <div class="shadow-ellipse ${getShadowClass(s.name)}"></div>
                        </div>
                        <div class="stats-container" style="position: relative; padding-top: 10px; z-index: 10; width: 100%; box-sizing: border-box; pointer-events: none;">
                            <div class="type-icon-container" style="position: absolute; top: -10px; right: -10px; z-index: 11;">
                                ${getTypeIconHtml(s.type, 40)}
                            </div>
                            <div class="name" style="text-align: center; color: white; font-weight: normal; font-size: 26px; text-shadow: var(--outline-med); margin-bottom: 4px;">
                                ${s.name}
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                                <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 15px; background: #222; border-radius: 6px; margin-top: 5px; overflow: hidden;">
                                    <div class="hp-fill" style="width:${hpPerc}%; background-color:${hpColor};"></div>
                                    <div class="hp-text move-description-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; pointer-events: none;">
                                        ${s.hp}/${s.hp}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/EN.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="EN" />
                                <div class="energy-blocks" style="display: flex; gap: 4px; flex: 1;">
                                    ${Array.from({length: 3}).map((_, idx) => `<div style="flex: 1; height: 6px; background-color: ${idx < (s.energy !== undefined ? s.energy : (s.startingEnergy !== undefined ? s.startingEnergy : 1)) ? '#4fc3f7' : '#222'}; border-radius: 2px;"></div>`).join('')}
                                </div>
                            </div>
                        </div>`;

                    slot.setAttribute('draggable', 'true');
                    slot.ondragstart = (e) => dragStartSelection(e, s.id, i);
                } else {
                    slot.classList.remove('filled');
                    slot.classList.remove('combatant');
                    slot.innerHTML = '';
                    slot.removeAttribute('draggable');
                    slot.ondragstart = null;
                }
            });
            
            const filledCount = selectionSlots.filter(s => s !== null).length;
            const btnStart = document.getElementById('btn-start-run');
            if (btnStart) {
                btnStart.disabled = filledCount !== 2;
                btnStart.classList.toggle('merge-btn-pulse', filledCount === 2);
            }

            // Render available starters
            const list = document.getElementById('selection-list');
            if (!list) return;
            list.innerHTML = '';
            
            const sortedStartersList = [...gameState.unlockedStarters].sort((a, b) => {
                return Object.keys(STARTERS).indexOf(a) - Object.keys(STARTERS).indexOf(b);
            });
            
            sortedStartersList.forEach(id => {
                // If already selected, visually disable it so it stays in place
                const isSelected = selectionSlots.some(s => s && s.id === id);

                const s = STARTERS[id];
                if (!s) return;
                const btn = document.createElement('div');
                btn.className = 'collection-square';
                btn.style.aspectRatio = 'auto';
                if (isSelected) {
                    btn.style.opacity = '0.3';
                    btn.style.filter = 'grayscale(1)';
                } else {
                    btn.style.cursor = 'grab';
                    btn.setAttribute('draggable', 'true');
                    btn.ondragstart = (e) => dragStartSelection(e, id, null);
                }
                btn.style.cursor = btn.style.cursor || 'pointer';
                btn.onclick = () => openCollectionDetails(s, true, false);
                const focus = STARTER_ART_FOCUS[id];
                const imgTransform = focus
                    ? `transform-origin:${focus.cx}% ${focus.cy}%; transform: translate(${50 - focus.cx}%, ${50 - focus.cy}%) scale(${focus.scale});`
                    : '';
                btn.innerHTML = `
                    <div class="collection-type-icon">${getTypeIconHtml(s.type, 40)}</div>
                    <div class="monster-art" style="position: absolute; inset: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                        ${s.art.includes('.png') ? `<img src="${s.art}" style="width:100%; height:100%; object-fit:contain; image-rendering: pixelated; ${imgTransform}" draggable="false" />` : `<div style="font-size:120px; line-height:1;">${s.art}</div>`}
                    </div>
                    <strong style="position: absolute; left: 0; right: 0; bottom: 16px; z-index: 3; pointer-events: none;">${s.name}</strong>
                `;
                list.appendChild(btn);
            });

            requestAnimationFrame(() => {
                list.querySelectorAll('.collection-square').forEach(card => {
                    card.style.height = card.offsetWidth + 'px';
                });
            });
        }

        function dragStartSelection(e, id, slotIndex) {
            draggedStarterId = id;
            draggedFromSlot = slotIndex;
            e.dataTransfer.setData('text/plain', id);
        }

        window.allowDrop = function(e) {
            e.preventDefault();
        }

        window.drop = function(e) {
            e.preventDefault();
            const targetSlot = e.target.closest('.select-slot');
            if (!targetSlot) return;
            
            const slotIndex = parseInt(targetSlot.getAttribute('data-slot'));
            const id = draggedStarterId;
            
            if (!id) return;

            // If dragging from one slot to another
            if (draggedFromSlot !== null) {
                const temp = selectionSlots[slotIndex];
                selectionSlots[slotIndex] = selectionSlots[draggedFromSlot];
                selectionSlots[draggedFromSlot] = temp;
            } else {
                // Dragging from list to slot
                const filledCount = selectionSlots.filter(s => s !== null).length;
                
                // If slot is empty and we already have 2, don't allow
                if (!selectionSlots[slotIndex] && filledCount >= 2) {
                    showToast('MAX 2 STARTERS');
                    return;
                }
                
                selectionSlots[slotIndex] = JSON.parse(JSON.stringify(STARTERS[id]));
            }
            
            updateSelectionUI();
        }

        window.dropList = function(e) {
            e.preventDefault();
            if (draggedFromSlot !== null) {
                selectionSlots[draggedFromSlot] = null;
                updateSelectionUI();
            }
        }

        function openSelectionModal(slotIndex) {
            const modal = document.getElementById('modal-selection');
            const list = document.getElementById('modal-list');
            document.getElementById('modal-title').innerText = "Select Starter";
            list.innerHTML = '';
            
            const closeBtn = document.getElementById('modal-selection-close-btn');
            closeBtn.onclick = () => closeModal('modal-selection');
            
            list.className = 'collection-grid';
            
            const sortedStartersModal = [...gameState.unlockedStarters].sort((a, b) => {
                return Object.keys(STARTERS).indexOf(a) - Object.keys(STARTERS).indexOf(b);
            });
            
            sortedStartersModal.forEach(id => {
                const s = STARTERS[id];
                const btn = document.createElement('div');
                btn.className = 'collection-square';
                
                btn.innerHTML = `
                    <div class="monster-art" style="flex: 1; min-height: 0;">${renderArt(s.art, 120)}</div>
                    <strong>${s.name}</strong>
                    <div style="padding: 0 6px; margin-top: 4px;">${getMiniHpEnergyHtml(s)}</div>
                `;
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

        function showGameAlert(title, message, onDone, htmlContent = '') {
            document.getElementById('notif-title').innerText = title;
            document.getElementById('notif-message').innerText = message;
            
            let htmlContainer = document.getElementById('notif-html');
            if (!htmlContainer) {
                htmlContainer = document.createElement('div');
                htmlContainer.id = 'notif-html';
                document.getElementById('notif-message').after(htmlContainer);
            }
            htmlContainer.innerHTML = htmlContent;

            const modal = document.getElementById('modal-notification');
            const btn = modal.querySelector('button');
            btn.onclick = () => {
                closeModal('modal-notification');
                if (onDone) onDone();
            };
            modal.style.display = 'flex';
        }

        // Simple "joined your party" popup for recruiting a monster that's
        // already unlocked in the Collection. First-time unlocks instead go
        // through showMergeResultDetails to show the full collection card.
        function showRecruitmentAlert(recruit, onDone) {
            document.getElementById('recruit-message').innerText = `Defeated ${recruit.name} joined your party!`;
            const recruitArt = document.getElementById('recruit-art');
            recruitArt.style.cssText = 'width:240px; height:240px; margin:10px auto; overflow:hidden; display:flex; align-items:center; justify-content:center;';
            recruitArt.innerHTML = renderFocusedArt(recruit.art);
            applyArtAutoFocus(recruitArt);
            document.getElementById('recruit-type-icon').innerHTML = buildTypeIconHtml(recruit);

            const modal = document.getElementById('modal-recruitment');
            const btn = document.getElementById('recruit-ok-btn');
            btn.onclick = () => {
                closeModal('modal-recruitment');
                if (onDone) onDone();
            };
            modal.style.display = 'flex';
        }

        function showGameConfirm(title, message, onYes, onNo, htmlContent = '') {
            document.getElementById('confirm-title').innerText = title;
            document.getElementById('confirm-message').innerText = message;
            
            let htmlContainer = document.getElementById('confirm-html');
            if (!htmlContainer) {
                htmlContainer = document.createElement('div');
                htmlContainer.id = 'confirm-html';
                document.getElementById('confirm-message').after(htmlContainer);
            }
            htmlContainer.innerHTML = htmlContent;
            applyArtAutoFocus(htmlContainer);

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

        // First-time starter pick: the 3 base starters, one of which the player bonds with before
        // the tutorial (which then unlocks the one it counters as the second starter).
        const FIRST_TIME_STARTERS = ['wolf', 'slime', 'sentry'];
        const STARTER_INTRO = {
            wolf: {
                role: 'Attacker', color: '#c62828', border: '#ff5252', glow: '255, 82, 82',
                quote: 'Ah, the Wolf... A ferocious hunter that bites first and asks questions never. A great choice for an aggressive playstyle.'
            },
            slime: {
                role: 'Support', color: '#2e7d32', border: '#66bb6a', glow: '102, 187, 106',
                quote: 'Ah, the Slime... Squishy, stubborn and surprisingly hard to put down. It patches up its allies and outlasts its foes. Perfect for a patient, supportive playstyle.'
            },
            sentry: {
                role: 'Balanced', color: '#e6c200', border: '#ffee58', glow: '255, 220, 60',
                quote: 'Ah, the Sentry... A steady sharpshooter that picks off foes from afar and stuns them in their tracks. A reliable choice for a balanced playstyle.'
            }
        };
        let focusedStarterId = null;
        let starterFocusBusy = false;

        window.playClicked = function() {
            if (window.isStartingPlay) return;
            window.isStartingPlay = true;

            const screenTitle = document.getElementById('screen-title');
            const fadeOverlay = document.getElementById('title-fade');
            const titleImg = document.getElementById('title-img');
            const titleArrow = document.getElementById('title-arrow');
            const titleText = document.getElementById('title-text');

            // Fade out the title elements first
            if (titleImg) {
                titleImg.style.animation = 'none';
                titleImg.style.opacity = '0';
            }
            if (titleArrow) {
                titleArrow.style.animation = 'none';
                titleArrow.style.opacity = '0';
            }
            if (titleText) {
                titleText.style.animation = 'none';
                titleText.style.opacity = '0';
            }
            
            setTimeout(() => {
                // Zoom effect
                screenTitle.style.transition = 'transform 1.5s ease-in';
                screenTitle.style.transform = 'scale(2.5)';
                screenTitle.style.transformOrigin = 'center center';
                
                // Fade to black
                if(fadeOverlay) fadeOverlay.style.opacity = '1';

                setTimeout(() => {
                    screenTitle.style.transition = '';
                    screenTitle.style.transform = '';
                    if(fadeOverlay) fadeOverlay.style.opacity = '0';
                    
                    // Restore original opacities for the next time the title screen is visited
                    if (titleImg) {
                        titleImg.style.opacity = '1';
                        titleImg.style.animation = '';
                    }
                    if (titleArrow) {
                        titleArrow.style.opacity = '1';
                        titleArrow.style.animation = '';
                    }
                    if (titleText) {
                        titleText.style.opacity = '1';
                        titleText.style.animation = '';
                    }
                    
                    window.isStartingPlay = false;

                    if (gameState.unlockedStarters.length < 2) {
                    showScreen('screen-first-time');
                    const ftFade = document.getElementById('first-time-bg-fade');
                    const ftContent = document.getElementById('first-time-content');
                    const ftOverlay = document.getElementById('first-time-overlay');
                    
                    if(ftFade) {
                        ftFade.style.transition = 'none';
                        ftFade.style.opacity = '1';
                    }
                    if(ftContent) {
                        ftContent.style.transition = 'none';
                        ftContent.style.opacity = '0';
                        ftContent.style.transform = 'scale(1.5)';
                    }
                    if(ftOverlay) {
                        ftOverlay.style.transition = 'none';
                        ftOverlay.style.background = 'rgba(0,0,0,0)';
                    }

                    resetStarterFocus();
                    renderFirstTimeStarters();

                    // Fade in background from black
                    setTimeout(() => {
                        if(ftFade) {
                            ftFade.style.transition = 'opacity 1s';
                            ftFade.style.opacity = '0';
                        }
                        
                        // After background is visible, impact UI and darken background
                        setTimeout(() => {
                            if(ftOverlay) {
                                ftOverlay.style.transition = 'background 0.5s';
                                ftOverlay.style.background = 'rgba(0,0,0,0.8)';
                            }
                            if(ftContent) {
                                ftContent.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                                ftContent.style.opacity = '1';
                                ftContent.style.transform = 'scale(1)';
                            }
                        }, 2000);
                    }, 50);
                } else {
                    showScreen('screen-menu');
                }
            }, 1500);
            }, 500);
        }

        // `animateIn` replays a staggered pop-in, used when coming BACK from the focused view.
        window.renderFirstTimeStarters = function(animateIn = false) {
            const list = document.getElementById('first-time-list');
            list.innerHTML = '';

            FIRST_TIME_STARTERS.forEach((id, i) => {
                const s = STARTERS[id];
                const intro = STARTER_INTRO[id];
                const btn = document.createElement('div');
                btn.className = `collection-square ft-starter-card${animateIn ? ' ft-return' : ''}`;
                btn.style.width = '200px';
                btn.style.cursor = 'pointer';
                btn.style.setProperty('--i', i);

                btn.innerHTML = `
                    <div class="ft-role-badge" style="background: ${intro.color}; border-color: ${intro.border};">${intro.role}</div>
                    <div style="position: absolute; top: 5px; right: 5px; filter: drop-shadow(0px 0px 2px #000);">${getTypeIconHtml(s.type, 40)}</div>
                    <div class="monster-art" style="pointer-events:none;">${renderArt(s.art, 140)}</div>
                    <strong style="font-size: 26px; color: #fff; text-shadow: var(--outline-med); pointer-events:none;">${s.name}</strong>
                `;

                btn.onclick = () => openStarterFocus(id, btn);
                list.appendChild(btn);
            });
        }

        function resetStarterFocus() {
            focusedStarterId = null;
            starterFocusBusy = false;
            const focus = document.getElementById('starter-focus');
            if (focus) focus.classList.remove('visible');
            const quote = document.getElementById('starter-focus-quote');
            if (quote) quote._typeToken = null;
            const content = document.getElementById('first-time-content');
            if (content) {
                content.style.visibility = '';
                content.style.pointerEvents = '';
            }
            document.querySelectorAll('#screen-first-time .ft-fadeable').forEach(el => el.classList.remove('ft-hide'));
        }

        // Clicked starter flares up and dissolves while the others and the header fall away,
        // then its stat card sweeps in from the left and the flavor text from the right.
        function openStarterFocus(id, cardEl) {
            if (starterFocusBusy || focusedStarterId) return;
            starterFocusBusy = true;
            focusedStarterId = id;

            const list = document.getElementById('first-time-list');
            [...list.children].forEach((card, i) => {
                card.classList.remove('ft-return');
                if (card === cardEl) {
                    card.classList.add('ft-chosen');
                } else {
                    card.style.animationDelay = `${i * 60}ms`;
                    card.classList.add('ft-dismiss');
                }
            });
            document.querySelectorAll('#screen-first-time .ft-fadeable').forEach(el => el.classList.add('ft-hide'));
            const overlay = document.getElementById('first-time-overlay');
            if (overlay) overlay.style.background = 'rgba(0,0,0,0.88)';

            const s = STARTERS[id];
            const intro = STARTER_INTRO[id];
            document.querySelector('#starter-focus-card .monster-detail-card').innerHTML = buildStarterPopupDetailHtml(s, 230);
            const role = document.getElementById('starter-focus-role');
            role.innerText = intro.role;
            role.style.background = intro.color;
            role.style.borderColor = intro.border;
            document.getElementById('starter-focus-glow').style.setProperty('--glow', intro.glow);

            const strong = ELEMENT_STRONG_AGAINST[s.type];
            const weak = getElementWeakAgainst(s.type);
            document.getElementById('starter-focus-matchups').innerHTML = `
                <div class="matchup matchup-good">Strong vs ${getTypeIconHtml(strong, 38)} ${strong}</div>
                <div class="matchup matchup-bad">Weak vs ${getTypeIconHtml(weak, 38)} ${weak}</div>
            `;
            const quote = document.getElementById('starter-focus-quote');
            quote._typeToken = null;
            quote.textContent = '';

            setTimeout(() => {
                const content = document.getElementById('first-time-content');
                content.style.visibility = 'hidden';
                content.style.pointerEvents = 'none';
                document.getElementById('starter-focus').classList.add('visible');
                setTimeout(() => typeText(quote, intro.quote, 28), 450);
                starterFocusBusy = false;
            }, 550);
        }

        window.closeStarterFocus = function() {
            if (starterFocusBusy || !focusedStarterId) return;
            starterFocusBusy = true;
            document.getElementById('starter-focus-quote')._typeToken = null;
            document.getElementById('starter-focus').classList.remove('visible');
            const overlay = document.getElementById('first-time-overlay');
            if (overlay) overlay.style.background = 'rgba(0,0,0,0.8)';

            setTimeout(() => {
                focusedStarterId = null;
                const content = document.getElementById('first-time-content');
                content.style.visibility = '';
                content.style.pointerEvents = '';
                document.querySelectorAll('#screen-first-time .ft-fadeable').forEach(el => el.classList.remove('ft-hide'));
                renderFirstTimeStarters(true);
                starterFocusBusy = false;
            }, 380);
        };

        window.chooseFocusedStarter = function() {
            if (starterFocusBusy || !focusedStarterId) return;
            const id = focusedStarterId;
            const s = STARTERS[id];
            const artHtml = `<div style="width:220px; height:220px; margin:10px auto; overflow:hidden; display:flex; align-items:center; justify-content:center;">${renderFocusedArt(s.art)}</div>`;
            showGameConfirm('CHOOSE YOUR STARTER', `Are you sure you want to start with the ${s.name}?`, () => {
                starterFocusBusy = true;
                document.getElementById('starter-focus').classList.add('chosen');
                const fadeOut = document.getElementById('first-time-fade-out');
                fadeOut.style.opacity = '1';
                setTimeout(() => {
                    startTutorial(id);
                    // The tutorial's boot screen now covers everything - quietly reset this screen.
                    fadeOut.style.transition = 'none';
                    fadeOut.style.opacity = '0';
                    void fadeOut.offsetWidth;
                    fadeOut.style.transition = 'opacity 1s';
                    document.getElementById('starter-focus').classList.remove('chosen');
                    resetStarterFocus();
                }, 1000);
            }, null, artHtml);
        };

        window.resetProgress = function() {
            showGameConfirm("RESET PROGRESS", "Are you sure you want to reset all your progress?", () => {
                localStorage.removeItem('soulbound_save');
                localStorage.removeItem('labborn_save');
                gameState = {
                    unlockedStarters: [],
                    discoveredMerges: [],
                    maxActReached: 1,
                    hasStartedFirstRun: false
                };
                playClicked();
            });
        }

        window.unlockAllProgress = function() {
            showGameConfirm("UNLOCK ALL PROGRESS", "Are you sure you want to unlock all starters, merges, and acts?", () => {
                const allStarters = Object.keys(STARTERS);
                const allMerges = MERGES.map(m => m.name);
                gameState = {
                    unlockedStarters: allStarters,
                    discoveredMerges: allMerges,
                    maxActReached: 3,
                    hasStartedFirstRun: true
                };
                saveGame();
                showScreen('screen-menu');
            });
        }
window.startCollectionZoom = function() {
    const zoomContainer = document.getElementById('menu-zoom-container');
    const fadeOverlay = document.getElementById('global-fade');
    const collectionBtn = document.getElementById('hitbox-collection');
    const startBtn = document.getElementById('hitbox-start');

    // Disable buttons
    collectionBtn.style.pointerEvents = 'none';
    startBtn.style.pointerEvents = 'none';

    // Restore transition
    zoomContainer.style.transition = 'transform 1.5s ease-in';
    void zoomContainer.offsetWidth; // force reflow

    // Zoom into the door under the collection button (a bit more to the right)
    zoomContainer.style.transformOrigin = '34% 67.3%';
    zoomContainer.style.transform = 'scale(4)';
    
    // Fade to black
    fadeOverlay.style.transition = 'opacity 1.5s ease-in';
    fadeOverlay.style.opacity = '1';

    setTimeout(() => {
        // Restore for next time
        zoomContainer.style.transition = 'none';
        zoomContainer.style.transform = 'scale(1)';
        collectionBtn.style.pointerEvents = 'auto';
        startBtn.style.pointerEvents = 'auto';
        
        // Open collection screen
        openCollection();
        
        // Fade from black
        setTimeout(() => {
            fadeOverlay.style.transition = 'opacity 1.5s ease-out';
            fadeOverlay.style.opacity = '0';
        }, 50);

    }, 1500);
};

window.startRunZoom = function() {
    const zoomContainer = document.getElementById('menu-zoom-container');
    const fadeOverlay = document.getElementById('global-fade');
    const collectionBtn = document.getElementById('hitbox-collection');
    const startBtn = document.getElementById('hitbox-start');

    // Disable buttons
    collectionBtn.style.pointerEvents = 'none';
    startBtn.style.pointerEvents = 'none';

    // Restore transition
    zoomContainer.style.transition = 'transform 1.5s ease-in';
    void zoomContainer.offsetWidth; // force reflow

    // Zoom into the road under the Start Run button (more to the right, and more down)
    zoomContainer.style.transformOrigin = '82% 60%';
    zoomContainer.style.transform = 'scale(4)';
    
    // Fade to black
    fadeOverlay.style.transition = 'opacity 1.5s ease-in';
    fadeOverlay.style.opacity = '1';

    setTimeout(() => {
        zoomContainer.style.transition = 'none';
        zoomContainer.style.transform = 'scale(1)';
        collectionBtn.style.pointerEvents = 'auto';
        startBtn.style.pointerEvents = 'auto';
        
        // Open arcs screen
        showScreen('screen-arcs');
        
        // Fade from black
        setTimeout(() => {
            fadeOverlay.style.transition = 'opacity 1.5s ease-out';
            fadeOverlay.style.opacity = '0';
        }, 50);
    }, 1500);
};
