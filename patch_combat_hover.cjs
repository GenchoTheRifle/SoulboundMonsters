const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

const target = "div.style.position = 'relative';";
const replacement = `div.style.position = 'relative';
                    div.onmouseenter = () => {
                        const idx = u.isEnemy ? combatState.enemies.indexOf(u) : currentRun.party.indexOf(u);
                        const teamEl = document.getElementById(u.isEnemy ? 'enemy-team' : 'player-team');
                        if (teamEl && teamEl.children[idx]) {
                            teamEl.children[idx].classList.add('timeline-hover');
                        }
                    };
                    div.onmouseleave = () => {
                        const idx = u.isEnemy ? combatState.enemies.indexOf(u) : currentRun.party.indexOf(u);
                        const teamEl = document.getElementById(u.isEnemy ? 'enemy-team' : 'player-team');
                        if (teamEl && teamEl.children[idx]) {
                            teamEl.children[idx].classList.remove('timeline-hover');
                        }
                    };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/combat.js', code);
