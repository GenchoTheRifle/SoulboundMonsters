const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

// Slam
const slamRe = /animEl\.style\.cssText = \`position:absolute; top:-200px; left:50%; transform:translate\(-50%, -50%\) scale\(1\.0\);(.*)\`;/;
code = code.replace(slamRe, "animEl.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(1.0);$1`;");

code = code.replace(
/animEl\.animate\(\[\s*\{\s*opacity:\s*0,\s*transform:\s*\`translate\(-50%,\s*-150px\)\s*scale\(1\.0\)\`\s*\},\s*\{\s*opacity:\s*1,\s*transform:\s*\`translate\(-50%,\s*-50px\)\s*scale\(1\.0\)\`\s*\},\s*\{\s*opacity:\s*1,\s*transform:\s*\`translate\(-50%,\s*50%\)\s*scale\(1\.0\)\`\s*\}\s*\],\s*\{\s*duration:\s*350,\s*easing:\s*'ease-in',\s*fill:\s*'forwards'\s*\}\);/,
`animEl.animate([
                                { opacity: 0, transform: \`translate(-50%, -250px) scale(1.0)\` },
                                { opacity: 1, transform: \`translate(-50%, -150px) scale(1.0)\` },
                                { opacity: 1, transform: \`translate(-50%, -50%) scale(1.0)\` }
                            ], { duration: 350, easing: 'ease-in', fill: 'forwards' });`
);

// Punch
code = code.replace(
/const startX = attacker\.isEnemy \? '100px' : '-100px';/,
"const startX = attacker.isEnemy ? '200px' : '-200px';\n                        const endX = attacker.isEnemy ? '100px' : '-100px';"
);

code = code.replace(
/animEl\.animate\(\[\s*\{\s*opacity:\s*0,\s*transform:\s*\`translate\(calc\(-50%\s*\+\s*\$\{startX\}\),\s*-50%\)\s*\$\{flip\}\s*scale\(1\.0\)\`\s*\},\s*\{\s*opacity:\s*1,\s*transform:\s*\`translate\(-50%,\s*-50%\)\s*\$\{flip\}\s*scale\(1\.2\)\`\s*\}\s*\],\s*\{\s*duration:\s*250,\s*easing:\s*'ease-in',\s*fill:\s*'forwards'\s*\}\);/,
`animEl.animate([
                                { opacity: 0, transform: \`translate(calc(-50% + \${startX}), -50%) \${flip} scale(1.0)\` },
                                { opacity: 1, transform: \`translate(calc(-50% + \${endX}), -50%) \${flip} scale(1.2)\` }
                            ], { duration: 250, easing: 'ease-in', fill: 'forwards' });`
);

// VFX double speed (75 instead of 250 in playStatusVFX)
let lines = code.split('\n');
lines[214] = lines[214].replace('250', '75');
code = lines.join('\n');

fs.writeFileSync('src/combat.js', code);
