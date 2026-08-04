const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
html = lines.slice(0, 275).concat(lines.slice(286)).join('\n');
fs.writeFileSync('index.html', html);
console.log("Fixed index.html");
