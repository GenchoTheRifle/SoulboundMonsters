const fs = require('fs');
let js = fs.readFileSync('src/merge.js', 'utf8');

const oldHpSection = `                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                            <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                            <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 10px; background: #222; border-radius: 5px; margin-top: 5px; overflow: hidden;">
                                <div class="hp-fill" style="width:\${hpPerc}%; background-color:\${hpColor};"></div>
                                <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px black; pointer-events: none;">
                                    \${m.currentHp}/\${m.hp}
                                </div>
                            </div>
                        </div>
                    </div>`;

const newHpSection = `                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                            <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                            <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 10px; background: #222; border-radius: 5px; overflow: hidden;">
                                <div class="hp-fill" style="width:\${hpPerc}%; background-color:\${hpColor};"></div>
                                <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px black; pointer-events: none;">
                                    \${m.currentHp}/\${m.hp}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                            <img src="Art/EN.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="EN" />
                            <div class="energy-blocks" style="display: flex; gap: 4px; flex: 1;">
                                \${Array.from({length: 3}).map((_, idx) => \`<div style="flex: 1; height: 6px; background-color: \${idx < 1 ? '#00a8ff' : '#222'}; border-radius: 2px;"></div>\`).join('')}
                            </div>
                        </div>
                    </div>`;

js = js.replace(oldHpSection, newHpSection);
fs.writeFileSync('src/merge.js', js);
console.log("Patched energy in merge slots");
