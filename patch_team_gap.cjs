const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');

content = content.replace(/row-gap: 10px;/, 'row-gap: 80px;');

fs.writeFileSync('src/styles.css', content);
