const fs = require('fs');
let js = fs.readFileSync('src/merge.js', 'utf8');

js = js.replace(/width: 160px; height: 160px;/g, 'width: 240px; height: 240px;');
js = js.replace(/renderArt\(outcome.art, 160\)/g, 'renderArt(outcome.art, 240)');
js = js.replace(/font-size: 24px;/g, 'font-size: 30px;');

fs.writeFileSync('src/merge.js', js);
console.log("Patched outcome size");
