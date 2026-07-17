const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('max-width: 1000px; width: 95%; padding: 40px;', 'max-width: 800px; width: 95%; padding: 20px;');
html = html.replace('font-size: 42px;', 'font-size: 32px;');
html = html.replace('renderArt(monster.art, 380)', 'renderArt(monster.art, 240)');

fs.writeFileSync('index.html', html);
console.log("Patched modal size");
