const fs = require('fs');
let js = fs.readFileSync('src/merge.js', 'utf8');

const startIdx = js.indexOf('function updateMergeUI() {');
const endIdx = js.indexOf('function allowDrop(ev) {');

if (startIdx !== -1 && endIdx !== -1) {
    const newFunc = `function updateMergeUI() {
        if (currentRun && currentRun.map) {
            const bgEl = document.getElementById('merge-arena-bg');
            if (bgEl) {
                bgEl.style.backgroundImage = \`url('Art/\${currentRun.map} Map.png')\`;
            }
        }
        
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
                            \${m.art.includes('.png') ? \\\`<img src="\${m.art}" draggable="false" />\\\` : \\\`<div style="font-size:100px; position:relative; z-index:2; line-height:1;">\${m.art}</div>\\\`}
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
        }
        
        // Update Merge Slots
        mergeSlots.forEach((s, i) => {
            const slot = document.getElementById(\`merge-slot-\${i}\`);
            if (s) {
                slot.classList.add('filled');
                slot.innerHTML = \`
                    <div draggable="true" ondragstart="dragStart(event, 'merge', \${i})" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:grab;">
                        <div style="width:140px; height:140px; margin-bottom:5px; pointer-events:none;">
                            \${renderArt(s.art, 120)}
                        </div>
                        <strong style="font-size:18px; text-align:center; pointer-events:none;">\${s.name}</strong>
                    </div>
                \`;
            } else {
                slot.classList.remove('filled');
                slot.innerHTML = '+';
            }
        });

        const btnMerge = document.getElementById('btn-do-merge');
        const outcomeDiv = document.getElementById('merge-outcome');
        
        if (mergeSlots[0] && mergeSlots[1]) {
            const p1 = mergeSlots[0];
            const p2 = mergeSlots[1];
            const outcome = MERGES.find(m => 
                (m.parents[0] === p1.id && m.parents[1] === p2.id) ||
                (m.parents[0] === p2.id && m.parents[1] === p1.id)
            );
            
            if (outcome) {
                btnMerge.disabled = false;
                const isUnlocked = gameState.discoveredMerges && gameState.discoveredMerges.includes(outcome.name);
                
                if (isUnlocked) {
                    outcomeDiv.innerHTML = \`
                        <h4 style="margin: 0 0 10px 0; color: #aaa;">OUTCOME</h4>
                        <div style="width: 160px; height: 160px; pointer-events: none;">
                            \${renderArt(outcome.art, 160)}
                        </div>
                        <strong style="font-size: 24px; margin-top: 10px; color: var(--accent);">\${outcome.name}</strong>
                    \`;
                } else {
                    outcomeDiv.innerHTML = \`
                        <h4 style="margin: 0 0 10px 0; color: #aaa;">OUTCOME</h4>
                        <div style="width: 160px; height: 160px; background: rgba(0,0,0,0.5); border: 2px dashed #666; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 64px; color: #666;">
                            ?
                        </div>
                        <strong style="font-size: 24px; margin-top: 10px; color: #ffd700; text-shadow: 1px 1px 2px #000;">NEW MERGE</strong>
                    \`;
                }
            } else {
                btnMerge.disabled = true;
                outcomeDiv.innerHTML = \`
                    <div style="color: #ff4444; font-weight: bold; font-size: 18px;">Incompatible</div>
                \`;
            }
        } else {
            btnMerge.disabled = true;
            outcomeDiv.innerHTML = '';
        }
    }
    
    `;
    
    js = js.substring(0, startIdx) + newFunc + js.substring(endIdx);
    fs.writeFileSync('src/merge.js', js);
}
