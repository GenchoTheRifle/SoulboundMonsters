const fs = require('fs');
let js = fs.readFileSync('src/collection.js', 'utf8');

const oldStats = `            document.getElementById('col-detail-stats').innerHTML = \`
                <div><span style="color:#51cf66; display:inline-block; width:60px;">HP:</span> \${monster.hp}</div>
                <div><span style="color:#fcc419; display:inline-block; width:60px;">SPD:</span> \${monster.spd}</div>
                <div><span style="color:#ff6b6b; display:inline-block; width:60px;">MATK:</span> \${matk}</div>
                <div><span style="color:#ff6b6b; display:inline-block; width:60px;">MDEF:</span> \${mdef}%</div>
                <div><span style="color:#339af0; display:inline-block; width:60px;">RATK:</span> \${ratk}</div>
                <div><span style="color:#339af0; display:inline-block; width:60px;">RDEF:</span> \${rdef}%</div>
            \`;`;

const newStats = `            document.getElementById('col-detail-stats').innerHTML = \`
                <div><span style="color:#51cf66; display:inline-block; width:60px;">HP:</span> \${monster.hp}</div>
                <div><span style="color:#00a8ff; display:inline-block; width:60px;">EN:</span> \${monster.startingEnergy !== undefined ? monster.startingEnergy : 1}</div>
                <div><span style="color:#ff6b6b; display:inline-block; width:60px;">MATK:</span> \${matk}</div>
                <div><span style="color:#ff6b6b; display:inline-block; width:60px;">MDEF:</span> \${mdef}%</div>
                <div><span style="color:#339af0; display:inline-block; width:60px;">RATK:</span> \${ratk}</div>
                <div><span style="color:#339af0; display:inline-block; width:60px;">RDEF:</span> \${rdef}%</div>
                <div><span style="color:#fcc419; display:inline-block; width:60px;">SPD:</span> \${monster.spd}</div>
            \`;`;

js = js.replace(oldStats, newStats);

fs.writeFileSync('src/collection.js', js);
console.log("Patched stats with energy");
