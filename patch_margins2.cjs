const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');

content = content.replace(/\.selection-team > \*:nth-child\(3\) \{ margin-top: -30px; \}/g, '.selection-team > *:nth-child(3) { margin-top: 0px; }');
content = content.replace(/\.selection-team > \*:nth-child\(4\) \{ margin-top: -30px; \}/g, '.selection-team > *:nth-child(4) { margin-top: 0px; }');

fs.writeFileSync('src/styles.css', content);
