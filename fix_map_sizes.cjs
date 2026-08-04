const fs = require('fs');

let js = fs.readFileSync('src/map.js', 'utf8');

js = js.replace(/div\.style\.width = '20vh';/, "div.style.width = '40vh';");
js = js.replace(/div\.style\.height = '20vh';/, "div.style.height = '40vh';");
js = js.replace(/div\.style\.minWidth = '120px';/, "div.style.minWidth = '240px';");
js = js.replace(/div\.style\.minHeight = '120px';/, "div.style.minHeight = '240px';");
js = js.replace(/div\.style\.maxWidth = '240px';/, "div.style.maxWidth = '480px';");
js = js.replace(/div\.style\.maxHeight = '240px';/, "div.style.maxHeight = '480px';");

fs.writeFileSync('src/map.js', js);
console.log("Map icon sizes fixed!");
