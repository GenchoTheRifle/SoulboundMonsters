const fs = require('fs');
let js = fs.readFileSync('src/map.js', 'utf8');

const oldStrStart = '        function updateMapPartyUI() {';
const oldStrEnd = '            updateMapPartyUI();\n        }';

const startIdx = js.indexOf(oldStrStart);
const endIdx = js.indexOf(oldStrEnd) + oldStrEnd.length;

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find block");
    process.exit(1);
}

const newTeamUI = `        window.updateTeamUI = function() {
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
                    
                    slot.innerHTML = \`
                        <div draggable="true" ondragstart="dragStartTeam(event, \${i})" style="width:100%; height:100%; position: absolute; top:0; left:0; z-index: 20; cursor:grab;"></div>
                        <div class="monster-art-container" style="pointer-events: none;">
                            <div class="art-content" style="position: relative;">
                                \${m.art.includes('.png') ? \`<img src="\${m.art}" draggable="false" />\` : \`<div style="font-size:100px; position:relative; z-index:2; line-height:1;">\${m.art}</div>\`}
                            </div>
                            <div class="shadow-ellipse"></div>
                        </div>
                        <div class="stats-container" style="position: relative; padding-top: 10px; z-index: 10; width: 100%; box-sizing: border-box; pointer-events: none;">
                            <div class="type-icon-container" style="position: absolute; top: -10px; right: -10px; z-index: 11;">
                                <img src="\${elementIcon}" style="width: 24px; height: 24px; filter: drop-shadow(0px 0px 2px #000);" alt="\${m.type}" />
                            </div>
                            <div class="name" style="text-align: center; color: white; font-weight: bold; font-size: 14px; text-shadow: 1px 1px 2px black; margin-bottom: 4px;">
                                \${m.name}
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                                <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 10px; background: #222; border-radius: 5px; overflow: hidden;">
                                    <div class="hp-fill" style="width:\${hpPerc}%; background-color:\${hpColor};"></div>
                                    <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px black; pointer-events: none;">
                                        \${Math.ceil(m.currentHp)}/\${m.hp}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/EN.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="EN" />
                                <div class="energy-blocks" style="display: flex; gap: 4px; flex: 1;">
                                    \${Array.from({length: 3}).map((_, idx) => \`<div style="flex: 1; height: 6px; background-color: \${idx < 1 ? '#00a8ff' : '#222'}; border-radius: 2px;"></div>\`).join('')}
                                </div>
                            </div>
                        </div>
                    \`;
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
                    btn.style.width = '100%';
                    btn.style.height = '320px';
                    btn.style.position = 'relative';
                    
                    const types = (Array.isArray(m.type) ? m.type : [m.type]).filter(Boolean);
                    const typeHtml = types.map(t => {
                        const icon = getElementIcon(t);
                        return icon ? \`<img src="\${icon}" style="width:36px; height:36px; filter: drop-shadow(1px 1px 2px black);" alt="\${t}" title="\${t}" />\` : \`<div class="type-tag type-\${t.toLowerCase()}" style="font-size: 14px; padding: 4px 8px;">\${t}</div>\`;
                    }).join('');
                    
                    btn.innerHTML = \`
                        <div style="height:200px; display:flex; justify-content:center; align-items:center; margin-bottom:10px;">\${renderArt(m.art, 160)}</div>
                        <strong style="font-size: 24px; text-shadow: 1px 1px 2px black;">\${m.name}</strong>
                        <div style="display: flex; justify-content: space-between; width: 100%; padding: 0 10px; margin-top: 10px;">
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <img src="Art/HP.png" style="width: 24px;" />
                                <span style="font-size: 16px; font-weight: bold; text-shadow: 1px 1px 2px black;">\${Math.ceil(m.currentHp)}/\${m.hp}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <img src="Art/EN.png" style="width: 24px;" />
                                <span style="font-size: 16px; font-weight: bold; text-shadow: 1px 1px 2px black;">\${m.energy || 0}</span>
                            </div>
                        </div>
                        <div style="position: absolute; top: 10px; right: 10px; display:flex; gap: 5px;">\${typeHtml}</div>
                    \`;
                    
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
        }`;

js = js.substring(0, startIdx) + newTeamUI + js.substring(endIdx);
fs.writeFileSync('src/map.js', js);
console.log("Patched team UI JS again");
