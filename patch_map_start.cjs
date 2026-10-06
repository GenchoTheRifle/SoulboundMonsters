const fs = require('fs');
let content = fs.readFileSync('src/map.js', 'utf8');

content = content.replace(/if \(backBtn\) backBtn\.style\.display = 'none';/, 
`if (backBtn) backBtn.style.display = 'none';
            const selTeam = document.getElementById('selection-player-team');
            if (selTeam) selTeam.style.display = 'none';`);

content = content.replace(/if \(backBtn\) backBtn\.style\.display = 'block';/,
`if (backBtn) backBtn.style.display = 'block';
                const selTeam2 = document.getElementById('selection-player-team');
                if (selTeam2) selTeam2.style.display = 'grid';`);

fs.writeFileSync('src/map.js', content);
