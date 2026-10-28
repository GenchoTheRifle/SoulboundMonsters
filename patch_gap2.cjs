const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');

content = content.replace(/\.selection-team \{\s*row-gap: 80px;\s*\}/, '.selection-team {\n    row-gap: 120px;\n}');

fs.writeFileSync('src/styles.css', content);
