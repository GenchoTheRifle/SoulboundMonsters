const fs = require('fs');
let mapJs = fs.readFileSync('src/map.js', 'utf8');

const regex = /\/\/ Hide nodes that are beyond the next upcoming one[\s\S]*?if \(i > currentRun\.nodeIndex \+ 1\) \{[\s\S]*?nodeWrapper\.style\.display = 'none';[\s\S]*?\}/;
mapJs = mapJs.replace(regex, '');

fs.writeFileSync('src/map.js', mapJs);
console.log("Removed display:none for upcoming nodes");
