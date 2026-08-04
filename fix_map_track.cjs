const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/<div id="map-track" style="position: relative; height: 100%; display: inline-block;">/, '<div id="map-track" style="position: relative; height: 100%; width: max-content;">');

fs.writeFileSync('index.html', html);
console.log("Fixed map track width");
