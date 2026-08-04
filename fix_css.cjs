const fs = require('fs');
let css = fs.readFileSync('src/styles.css', 'utf8');
css = css.replace(/opacity: 0\.8;/g, '');
fs.writeFileSync('src/styles.css', css);
console.log("CSS fixed!");
