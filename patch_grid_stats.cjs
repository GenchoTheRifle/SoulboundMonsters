const fs = require('fs');
let js = fs.readFileSync('src/map.js', 'utf8');

const oldHtml = `                        <div style="display: flex; justify-content: space-between; width: 100%; padding: 0 10px; margin-top: 10px;">
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <img src="Art/HP.png" style="width: 24px;" />
                                <span style="font-size: 16px; font-weight: bold; text-shadow: 1px 1px 2px black;">\${Math.ceil(m.currentHp)}/\${m.hp}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <img src="Art/EN.png" style="width: 24px;" />
                                <span style="font-size: 16px; font-weight: bold; text-shadow: 1px 1px 2px black;">\${m.energy || 0}</span>
                            </div>
                        </div>`;

const newHtml = `                        <div style="display: flex; flex-direction: column; width: 100%; padding: 0 10px; margin-top: 10px;">
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
                        </div>`;

js = js.replace(oldHtml, newHtml);

fs.writeFileSync('src/map.js', js);
console.log("Patched grid stats");
