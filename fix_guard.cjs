const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

function updateGuard(moves) {
    if (!moves) return;
    moves.forEach(m => {
        if (m.effect && m.effect.type === 'guard') {
            m.effect.turns = 999;
        }
        if (m.effect && m.effect.type === 'savage_stance') {
            m.effect.guard_turns = 999;
        }
    });
}

for (const key in data.STARTERS) updateGuard(data.STARTERS[key].moves);
data.MERGES.forEach(m => updateGuard(m.moves));
for (const key in data.BOSSES) updateGuard(data.BOSSES[key].moves);

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Fixed Guard turns');
