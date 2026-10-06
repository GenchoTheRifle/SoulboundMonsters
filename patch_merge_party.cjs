const fs = require('fs');
let js = fs.readFileSync('src/merge.js', 'utf8');

const oldUpdateParty = `        function updateMergeUI() {
            // Update Party Slots
            for (let i = 0; i < 4; i++) {
                const slot = document.getElementById(\`merge-party-slot-\${i}\`);
                const m = currentRun.party[i];
                if (m && !mergeSlots.includes(m)) {
                    slot.innerHTML = \`
                        <div draggable="true" ondragstart="dragStart(event, 'party', \${i})" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:grab;">
                            <div style="width:140px; height:140px; margin-bottom:5px; pointer-events:none;">
                                \${renderArt(m.art, 120)}
                            </div>
                            <strong style="font-size:18px; text-align:center; pointer-events:none;">\${m.name}</strong>
                        </div>
                    \`;
                    slot.classList.add('filled');
                } else {
                    slot.innerHTML = '';
                    slot.classList.remove('filled');
                }
            }`;

const newUpdateParty = `        function updateMergeUI() {
            // Update Party Slots
            for (let i = 0; i < 4; i++) {
                const slot = document.getElementById(\`merge-party-slot-\${i}\`);
                const m = currentRun.party[i];
                if (m && !mergeSlots.includes(m)) {
                    slot.classList.add('filled');
                    slot.classList.add('combatant');
                    
                    const hpPerc = Math.max(0, Math.min(100, (m.currentHp / m.hp) * 100));
                    let hpColor = hpPerc > 50 ? '#22c55e' : hpPerc > 25 ? '#eab308' : '#ef4444';
                    const elementIcon = getElementIcon(m.type);
                    
                    slot.innerHTML = \`
                        <div draggable="true" ondragstart="dragStart(event, 'party', \${i})" style="width:100%; height:100%; position: absolute; top:0; left:0; z-index: 20; cursor:grab;"></div>
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
                                <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 10px; background: #222; border-radius: 5px; margin-top: 5px; overflow: hidden;">
                                    <div class="hp-fill" style="width:\${hpPerc}%; background-color:\${hpColor};"></div>
                                    <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px black; pointer-events: none;">
                                        \${m.currentHp}/\${m.hp}
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                } else {
                    slot.innerHTML = '';
                    slot.classList.remove('filled');
                    slot.classList.remove('combatant');
                }
            }`;

js = js.replace(oldUpdateParty, newUpdateParty);
fs.writeFileSync('src/merge.js', js);
