const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('max-width: 600px; width: 90%; padding: 20px;', 'max-width: 750px; width: 95%; padding: 25px;');
html = html.replace('font-size: 24px;', 'font-size: 28px;'); // Name
html = html.replace('gap: 20px;', 'gap: 30px;');

fs.writeFileSync('index.html', html);
console.log("Patched modal size");
