const fs = require('fs');
let js = fs.readFileSync('src/collection.js', 'utf8');

js = js.replace('renderArt(monster.art, 160)', 'renderArt(monster.art, 200)');

fs.writeFileSync('src/collection.js', js);
console.log("Patched renderArt in JS");
