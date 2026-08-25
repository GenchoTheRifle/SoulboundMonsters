const fs = require('fs');
let js = fs.readFileSync('src/map.js', 'utf8');

const startRunOld = `        function startRun() {
            const drawer = document.getElementById('selection-drawer');
            if (drawer) drawer.style.transform = 'translateX(100%)';
            
            const title = document.querySelector('#screen-selection h2');
            const backBtn = document.querySelector('#screen-selection > button');
            if (title) title.style.display = 'none';
            if (backBtn) backBtn.style.display = 'none';
            const selTeam = document.getElementById('selection-player-team');
            if (selTeam) selTeam.style.opacity = '0';
            
            // Create transition overlay`;

const startRunNew = `        function startRun() {
            const btn = document.getElementById('btn-start-run');
            if (btn) btn.disabled = true;
            
            // Create transition overlay`;

js = js.replace(startRunOld, startRunNew);

const initCombatOld = `                    initCombat(currentRun.nodes[0]);
                    
                    // Fade out`;

const initCombatNew = `                    initCombat(currentRun.nodes[0]);
                    
                    const drawer = document.getElementById('selection-drawer');
                    if (drawer) drawer.style.transform = 'translateX(100%)';
                    
                    const title = document.querySelector('#screen-selection h2');
                    const backBtn = document.querySelector('#screen-selection > button');
                    if (title) title.style.display = 'none';
                    if (backBtn) backBtn.style.display = 'none';
                    const selTeam = document.getElementById('selection-player-team');
                    if (selTeam) selTeam.style.opacity = '0';
                    
                    // Fade out`;

js = js.replace(initCombatOld, initCombatNew);

fs.writeFileSync('src/map.js', js);
console.log("Patched transition");
