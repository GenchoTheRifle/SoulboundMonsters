const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

function updateBulletstorm(moves) {
    if (!moves) return;
    moves.forEach(m => {
        if (m.n === 'Bulletstorm') {
            m.hits = 3;
        }
    });
}

for (const key in data.STARTERS) updateBulletstorm(data.STARTERS[key].moves);
data.MERGES.forEach(m => updateBulletstorm(m.moves));
for (const key in data.BOSSES) updateBulletstorm(data.BOSSES[key].moves);

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Fixed Bulletstorm');
