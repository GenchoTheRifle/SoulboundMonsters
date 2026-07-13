const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

const slamPunchCode = `
                if (move.n.includes("Slam")) {
                    animDelay = 350;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Slam_1.png";
                        animEl.style.cssText = \\\`position:absolute; top:-200px; left:50%; transform:translate(-50%, -50%) scale(1.0); width:150px; height:auto; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));\\\`;
                        const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                        artContainer.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: \\\`translate(-50%, -150px) scale(1.0)\\\` },
                                { opacity: 1, transform: \\\`translate(-50%, -50px) scale(1.0)\\\` },
                                { opacity: 1, transform: \\\`translate(-50%, 50%) scale(1.0)\\\` }
                            ], { duration: 350, easing: 'ease-in', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 350));
                            
                            targetEl.animate([
                                { transform: 'translate(0, 0)' },
                                { transform: 'translate(0, 10px)' },
                                { transform: 'translate(0, -5px)' },
                                { transform: 'translate(0, 0)' }
                            ], { duration: 200, easing: 'ease-out' });
                            
                            await new Promise(r => setTimeout(r, 200));
                            
                            const fadeOut = animEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
                            await fadeOut.finished;
                            
                            if (animEl.parentNode) animEl.parentNode.removeChild(animEl);
                        })();
                    }
                }

                if (move.n.includes("Punch")) {
                    animDelay = 250;
                    const targetEl = getElementForUnit(t);
                    if (targetEl) {
                        const animEl = document.createElement('img');
                        animEl.src = "Art/Punch_1.png";
                        const flip = attacker.isEnemy ? 'scaleX(-1)' : 'scaleX(1)';
                        const startX = attacker.isEnemy ? '100px' : '-100px';
                        
                        animEl.style.cssText = \\\`position:absolute; top:50%; left:50%; transform:translate(calc(-50% + \${startX}), -50%) \${flip} scale(1.0); width:150px; height:auto; z-index:100; pointer-events:none; opacity: 0; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));\\\`;
                        const artContainer = targetEl.querySelector('.monster-art-container') || targetEl;
                        artContainer.appendChild(animEl);
                        
                        (async () => {
                            animEl.animate([
                                { opacity: 0, transform: \\\`translate(calc(-50% + \${startX}), -50%) \${flip} scale(1.0)\\\` },
                                { opacity: 1, transform: \\\`translate(-50%, -50%) \${flip} scale(1.2)\\\` }
                            ], { duration: 250, easing: 'ease-in', fill: 'forwards' });
                            
                            await new Promise(r => setTimeout(r, 250));
                            
                            targetEl.animate([
                                { transform: 'translate(0, 0)' },
                                { transform: \\\`translate(\${attacker.isEnemy ? '-10px' : '10px'}, 0)\\\` },
                                { transform: \\\`translate(\${attacker.isEnemy ? '5px' : '-5px'}, 0)\\\` },
                                { transform: 'translate(0, 0)' }
                            ], { duration: 200, easing: 'ease-out' });
                            
                            await new Promise(r => setTimeout(r, 200));
                            
                            const fadeOut = animEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
                            await fadeOut.finished;
                            
                            if (animEl.parentNode) animEl.parentNode.removeChild(animEl);
                        })();
                    }
                }
`;

code = code.replace(/if \(move\.n\.includes\("Stun Bolt"\)\) \{/, slamPunchCode + '\n                if (move.n.includes("Stun Bolt")) {');
fs.writeFileSync('src/combat.js', code);
