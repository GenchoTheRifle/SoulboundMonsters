const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
    /width: 50px; height: 50px;/g,
    'width: 70px; height: 70px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.8));'
);

fs.writeFileSync('index.html', html);
console.log("Fixed Cog 2");
