const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

// Update playStatusVFX delay
code = code.replace(/await new Promise\(r => setTimeout\(r, 75\)\);/g, "await new Promise(r => setTimeout(r, 250));");

// Update playStatusVFX size to be 10% smaller than current (current is 1.8) -> let's make it 1.6
code = code.replace(/scale\(1\.8\)/g, "scale(1.6)");

// Spore animation mushroom size
code = code.replace(/width:225px;/g, "width:200px;");

fs.writeFileSync('src/combat.js', code);
