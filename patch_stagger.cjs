const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');

// First replace the margin rules entirely with new ones
content = content.replace(/#player-team > \*:nth-child\(1\)[\s\S]*?margin-top: 80px;\s*\}/, 
`#player-team > *:nth-child(1), #enemy-team > *:nth-child(1), .selection-team > *:nth-child(1) {
            margin-top: 0px;
        }
        #player-team > *:nth-child(2), #enemy-team > *:nth-child(2), .selection-team > *:nth-child(2) {
            margin-top: 0px;
        }
        #player-team > *:nth-child(3), #enemy-team > *:nth-child(3), .selection-team > *:nth-child(3) {
            margin-top: -30px;
        }
        #player-team > *:nth-child(4), #enemy-team > *:nth-child(4), .selection-team > *:nth-child(4) {
            margin-top: -30px;
        }`);

fs.writeFileSync('src/styles.css', content);
