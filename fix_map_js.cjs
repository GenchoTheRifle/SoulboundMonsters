const fs = require('fs');
let mapJs = fs.readFileSync('src/map.js', 'utf8');

// We want to remove everything from window.updateMapPartyUI down to the end of dropMapParty
const unwantedLogicRegex = /window\.updateMapPartyUI = function\(\) \{[\s\S]*?window\.dropMapParty = function\(ev\) \{[\s\S]*?updateMapPartyUI\(\);\s*\};/g;

mapJs = mapJs.replace(unwantedLogicRegex, '');
fs.writeFileSync('src/map.js', mapJs);
console.log("Removed redundant map modal functions");
