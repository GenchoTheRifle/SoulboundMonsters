const fs = require('fs');
let lines = fs.readFileSync('src/combat.js', 'utf8').split('\n');

lines[214] = lines[214].replace('75', '250');
lines[858] = lines[858].replace('75', '250');
// lines[878] is Bite wait, 75 is correct.
lines[922] = lines[922].replace('75', '150');
lines[1104] = lines[1104].replace('75', '250');
lines[1113] = lines[1113].replace('75', '250');
lines[1202] = lines[1202].replace('75', '250');
lines[1237] = lines[1237].replace('75', '150');
lines[1325] = lines[1325].replace('75', '150');
lines[1374] = lines[1374].replace('75', '150');

fs.writeFileSync('src/combat.js', lines.join('\n'));
