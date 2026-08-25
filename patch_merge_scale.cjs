const fs = require('fs');
let code = fs.readFileSync('src/merge.js', 'utf8');
code = code.replace(/transform: scale\(0\.6\)/g, 'transform: scale(1.0)');
code = code.replace(/transform: scale\(1\.2\)/g, 'transform: scale(1.0)');
fs.writeFileSync('src/merge.js', code);
console.log("Patched merge scale!");
