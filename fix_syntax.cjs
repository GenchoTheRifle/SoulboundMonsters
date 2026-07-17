const fs = require('fs');
let js = fs.readFileSync('src/merge.js', 'utf8');

js = js.replace(/\\\`<img/g, '`<img');
js = js.replace(/\\\` : \\\`\<div/g, '` : `<div');
js = js.replace(/\\\`\}/g, '`}');

fs.writeFileSync('src/merge.js', js);
console.log("Fixed syntax");
