const fs = require('fs');
let code = fs.readFileSync('src/merge.js', 'utf8');
code = code.replace(/transform: scale\(1\.0\); transform-origin: center;/g, '');
fs.writeFileSync('src/merge.js', code);
