const fs = require('fs');
let code = fs.readFileSync('src/merge.js', 'utf8');

// replace mergeSlots innerHTML
code = code.replace(/<div style="width:140px; height:140px; margin-bottom:5px; pointer-events:none;">[\s\S]*?\$\{renderArt\(s.art, 120\)\}[\s\S]*?<\/div>/, `<div class="monster-art-container" style="pointer-events: none; transform: scale(0.6); transform-origin: center;">
                            <div class="art-content" style="position: relative;">
                                \${s.art.includes('.png') ? \`<img src="\${s.art}" draggable="false" />\` : \`<div style="font-size:100px; position:relative; z-index:2; line-height:1;">\${s.art}</div>\`}
                            </div>
                            <div class="shadow-ellipse \${getShadowClass(s.name)}"></div>
                        </div>`);

// add classlist combatant to slot if filled
code = code.replace(/slot\.classList\.add\('filled'\);/, "slot.classList.add('filled');\n                slot.classList.add('combatant');");
code = code.replace(/slot\.innerHTML = '\+';/, "slot.classList.remove('combatant');\n                slot.innerHTML = '+';");

// replace outcome innerHTML
code = code.replace(/<div style="width: 240px; height: 240px; pointer-events: none;">[\s\S]*?\$\{renderArt\(outcome.art, 240\)\}[\s\S]*?<\/div>/, `<div class="combatant" style="pointer-events: none;">
                            <div class="monster-art-container" style="pointer-events: none; transform: scale(1.2); transform-origin: center;">
                                <div class="art-content" style="position: relative;">
                                    \${outcome.art.includes('.png') ? \`<img src="\${outcome.art}" draggable="false" />\` : \`<div style="font-size:100px; position:relative; z-index:2; line-height:1;">\${outcome.art}</div>\`}
                                </div>
                                <div class="shadow-ellipse \${getShadowClass(outcome.name)}"></div>
                            </div>
                        </div>`);

fs.writeFileSync('src/merge.js', code);
