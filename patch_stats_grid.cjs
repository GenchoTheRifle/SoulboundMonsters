const fs = require('fs');
let js = fs.readFileSync('src/map.js', 'utf8');

const oldGridLogic = `            // Render Stats grid
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
                        return icon ? \`<img src="\${icon}" style="width:36px; height:36px; filter: drop-shadow(1px 1px 2px black);" alt="\${t}" title="\${t}" />\` : \`<div class="type-tag type-\${t.toLowerCase()}" style="font-size: 14px; padding: 4px 8px;">\${t}</div>\`;
                    }).join('');
                    
                    btn.innerHTML = \`
                        <div style="height:200px; display:flex; justify-content:center; align-items:center; margin-bottom:10px;">\${renderArt(m.art, 160)}</div>
                        <strong style="font-size: 24px; text-shadow: 1px 1px 2px black;">\${m.name}</strong>
                        <div style="display: flex; flex-direction: column; width: 100%; padding: 0 10px; margin-top: 10px;">
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                                <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 12px; background: #222; border-radius: 6px; overflow: hidden; border: 1px solid #000;">
                                    <div class="hp-fill" style="height: 100%; width:\${Math.max(0, Math.min(100, (m.currentHp / m.hp) * 100))}%; background-color:\${(m.currentHp / m.hp) * 100 > 50 ? '#22c55e' : (m.currentHp / m.hp) * 100 > 25 ? '#eab308' : '#ef4444'};"></div>
                                    <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; text-shadow: 1px 1px 2px black; pointer-events: none;">
                                        \${Math.ceil(m.currentHp)}/\${m.hp}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/EN.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="EN" />
                                <div class="energy-blocks" style="display: flex; gap: 4px; flex: 1;">
                                    \${Array.from({length: 3}).map((_, idx) => \\\`<div style="flex: 1; height: 8px; background-color: \${idx < (m.startingEnergy !== undefined ? m.startingEnergy : 1) ? '#00a8ff' : '#222'}; border-radius: 2px; border: 1px solid #000;"></div>\\\`).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="position: absolute; top: 10px; right: 10px; display:flex; gap: 5px;">\${typeHtml}</div>
                    \`;
                    
                    btn.onclick = () => openCollectionDetails(m, true, false);
                    statsGrid.appendChild(btn);
                });
            }`;

const newGridLogic = `            // Render Stats grid
            const statsGrid = document.getElementById('team-stats-grid');
            if (statsGrid) {
                statsGrid.innerHTML = '';
                const visualOrder = [2, 0, 3, 1];
                visualOrder.forEach(idx => {
                    const m = currentRun.party[idx];
                    const btn = document.createElement('div');
                    btn.className = 'collection-square';
                    btn.style.width = '100%'; btn.style.aspectRatio = '1 / 1'; btn.style.height = 'auto';
                    btn.style.position = 'relative';
                    
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
                        return icon ? \`<img src="\${icon}" style="width:36px; height:36px; filter: drop-shadow(1px 1px 2px black);" alt="\${t}" title="\${t}" />\` : \`<div class="type-tag type-\${t.toLowerCase()}" style="font-size: 14px; padding: 4px 8px;">\${t}</div>\`;
                    }).join('');
                    
                    btn.innerHTML = \`
                        <div style="height:200px; display:flex; justify-content:center; align-items:center; margin-bottom:10px;">\${renderArt(m.art, 160)}</div>
                        <strong style="font-size: 24px; text-shadow: 1px 1px 2px black;">\${m.name}</strong>
                        <div style="display: flex; flex-direction: column; width: 100%; padding: 0 10px; margin-top: 10px;">
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                                <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 12px; background: #222; border-radius: 6px; overflow: hidden; border: 1px solid #000;">
                                    <div class="hp-fill" style="height: 100%; width:\${Math.max(0, Math.min(100, (m.currentHp / m.hp) * 100))}%; background-color:\${(m.currentHp / m.hp) * 100 > 50 ? '#22c55e' : (m.currentHp / m.hp) * 100 > 25 ? '#eab308' : '#ef4444'};"></div>
                                    <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; text-shadow: 1px 1px 2px black; pointer-events: none;">
                                        \${Math.ceil(m.currentHp)}/\${m.hp}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <img src="Art/EN.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="EN" />
                                <div class="energy-blocks" style="display: flex; gap: 4px; flex: 1;">
                                    \${Array.from({length: 3}).map((_, i) => \\\`<div style="flex: 1; height: 8px; background-color: \${i < (m.startingEnergy !== undefined ? m.startingEnergy : 1) ? '#00a8ff' : '#222'}; border-radius: 2px; border: 1px solid #000;"></div>\\\`).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="position: absolute; top: 10px; right: 10px; display:flex; gap: 5px;">\${typeHtml}</div>
                    \`;
                    
                    btn.onclick = () => openCollectionDetails(m, true, false);
                    statsGrid.appendChild(btn);
                });
            }`;

js = js.replace(oldGridLogic, newGridLogic);
fs.writeFileSync('src/map.js', js);
console.log("Patched team stats grid order");
