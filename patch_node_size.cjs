const fs = require('fs');
let mapJs = fs.readFileSync('src/map.js', 'utf8');

mapJs = mapJs.replace(
    /div\.style\.boxShadow = 'none';/g,
    `div.style.boxShadow = 'none';
                div.style.width = '10vh';
                div.style.height = '10vh';
                div.style.minWidth = '60px';
                div.style.minHeight = '60px';
                div.style.maxWidth = '120px';
                div.style.maxHeight = '120px';`
);

fs.writeFileSync('src/map.js', mapJs);
console.log("Patched node size!");
