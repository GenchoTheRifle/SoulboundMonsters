const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');

content = content.replace(/\.select-slot \.art-content \{\s*animation: none !important;\s*\}/, '');

fs.writeFileSync('src/styles.css', content);
