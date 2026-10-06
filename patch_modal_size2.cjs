const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('max-width: 800px; width: 95%; padding: 20px;', 'max-width: 600px; width: 90%; padding: 20px;');
html = html.replace('font-size: 32px;', 'font-size: 24px;');
html = html.replace('gap: 40px;', 'gap: 20px;');
html = html.replace('font-size: 28px;', 'font-size: 20px;'); // Moves header
html = html.replace('font-size: 28px; padding: 20px; margin-top: 30px;', 'font-size: 18px; padding: 10px; margin-top: 20px;'); // Close btn

fs.writeFileSync('index.html', html);
console.log("Patched modal size again");
