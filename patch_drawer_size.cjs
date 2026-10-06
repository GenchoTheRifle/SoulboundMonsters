const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/width: 750px;/, 'width: 850px;');
fs.writeFileSync('index.html', content);
