const fs = require('fs');
let js = fs.readFileSync('src/merge.js', 'utf8');

const oldBg = `        if (currentRun && currentRun.map) {
            const bgEl = document.getElementById('merge-arena-bg');
            if (bgEl) {
                bgEl.style.backgroundImage = \`url('Art/\${currentRun.map} Map.png')\`;
            }
        }`;

const newBg = `        if (currentRun && currentRun.arcId) {
            const bgEl = document.getElementById('merge-arena-bg');
            if (bgEl) {
                bgEl.style.backgroundImage = getMapBackground(currentRun.arcId);
            }
        }`;

js = js.replace(oldBg, newBg);
fs.writeFileSync('src/merge.js', js);
console.log("Fixed BG");
