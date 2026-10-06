const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');

content = content.replace(/#player-team > \*:nth-child\(2\), #enemy-team > \*:nth-child\(2\), \.selection-team > \*:nth-child\(2\) \{\s*margin-top: -20px;\s*\}/, 
`#player-team > *:nth-child(2), #enemy-team > *:nth-child(2), .selection-team > *:nth-child(2) {
            margin-top: 50px;
        }`);

content = content.replace(/#player-team > \*:nth-child\(4\), #enemy-team > \*:nth-child\(4\), \.selection-team > \*:nth-child\(4\) \{\s*margin-top: 0px;\s*\}/,
`#player-team > *:nth-child(4), #enemy-team > *:nth-child(4), .selection-team > *:nth-child(4) {
            margin-top: 80px;
        }`);

fs.writeFileSync('src/styles.css', content);
