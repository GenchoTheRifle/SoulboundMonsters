const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');

// Revert .team row-gap
content = content.replace(/row-gap: 80px;/, 'row-gap: 10px;');

// Split the nth-child margin rules to keep the original for #player-team and #enemy-team,
// and the new for .selection-team
content = content.replace(/#player-team > \*:nth-child\(1\), #enemy-team > \*:nth-child\(1\), \.selection-team > \*:nth-child\(1\) \{\s*margin-top: 0px;\s*\}/, 
`#player-team > *:nth-child(1), #enemy-team > *:nth-child(1) { margin-top: 30px; }
.selection-team > *:nth-child(1) { margin-top: 0px; }`);

content = content.replace(/#player-team > \*:nth-child\(2\), #enemy-team > \*:nth-child\(2\), \.selection-team > \*:nth-child\(2\) \{\s*margin-top: 0px;\s*\}/, 
`#player-team > *:nth-child(2), #enemy-team > *:nth-child(2) { margin-top: -20px; }
.selection-team > *:nth-child(2) { margin-top: 0px; }`);

content = content.replace(/#player-team > \*:nth-child\(3\), #enemy-team > \*:nth-child\(3\), \.selection-team > \*:nth-child\(3\) \{\s*margin-top: -30px;\s*\}/, 
`#player-team > *:nth-child(3), #enemy-team > *:nth-child(3) { margin-top: 50px; }
.selection-team > *:nth-child(3) { margin-top: -30px; }`);

content = content.replace(/#player-team > \*:nth-child\(4\), #enemy-team > \*:nth-child\(4\), \.selection-team > \*:nth-child\(4\) \{\s*margin-top: -30px;\s*\}/, 
`#player-team > *:nth-child(4), #enemy-team > *:nth-child(4) { margin-top: 0px; }
.selection-team > *:nth-child(4) { margin-top: -30px; }`);

// Change the collection-square img rules to only apply to #selection-list
content = content.replace(/\.collection-square img/g, '#selection-list .collection-square img');
content = content.replace(/\.collection-square \.monster-art/g, '#selection-list .collection-square .monster-art');

fs.writeFileSync('src/styles.css', content);
