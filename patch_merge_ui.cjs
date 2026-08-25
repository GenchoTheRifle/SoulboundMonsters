const fs = require('fs');
let js = fs.readFileSync('src/merge.js', 'utf8');

const oldUpdateUI = `            // Update Merge Slots
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

            document.getElementById('btn-do-merge').disabled = (mergeSlots[0] === null || mergeSlots[1] === null);
        }`;

const newUpdateUI = `            // Update Merge Slots
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
        }`;

js = js.replace(oldUpdateUI, newUpdateUI);

// Also need to patch how the left side slots are rendered. They should use the same UI as Selection Screen.
// Let's modify updateMergeUI for Party Slots as well.
