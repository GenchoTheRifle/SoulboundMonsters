const fs = require('fs');
let js = fs.readFileSync('src/collection.js', 'utf8');

js = js.replace('renderArt(monster.art, 380)', 'renderArt(monster.art, 240)');

fs.writeFileSync('src/collection.js', js);
console.log("Patched renderArt in JS");
