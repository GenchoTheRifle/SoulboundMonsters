const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

function updateStun(moves) {
    if (!moves) return;
    moves.forEach(m => {
        if (m.n === 'Stun Bolt') {
            m.p = 0;
            m.effect = { type: 'stun', chance: 1.0, turns: 1 };
        }
        if (m.n === 'Elite Stun Bolt') {
            m.p = 1;
            m.effect = { type: 'stun', chance: 1.0, turns: 1 };
        }
    });
}

for (const key in data.STARTERS) updateStun(data.STARTERS[key].moves);
data.MERGES.forEach(m => updateStun(m.moves));
for (const key in data.BOSSES) updateStun(data.BOSSES[key].moves);

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Fixed Stun Bolts');
