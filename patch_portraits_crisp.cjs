const fs = require('fs');

let combatJs = fs.readFileSync('src/combat.js', 'utf8');

combatJs = combatJs.replace(/img\.style\.imageRendering = 'pixelated';/g, "img.style.imageRendering = 'auto';");

fs.writeFileSync('src/combat.js', combatJs);
console.log("Patched portraits crisp!");
