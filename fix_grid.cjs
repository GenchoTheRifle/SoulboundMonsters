const fs = require('fs');
let js = fs.readFileSync('src/map.js', 'utf8');

js = js.replace("btn.style.width = '100%';", "");
js = js.replace("btn.style.height = '320px';", "btn.style.width = '100%'; btn.style.aspectRatio = '1 / 1'; btn.style.height = 'auto';");

fs.writeFileSync('src/map.js', js);
console.log("Fixed grid items");
