const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

for (const key in data.BOSSES) {
    const boss = data.BOSSES[key];
    boss.moves.forEach(m => {
        if (m.n === "Elite Stun Bolt") {
            m.effect.chance = 1.0;
            m.effect.turns = 1;
        }
    });
}

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Fixed Elite Stun Bolt');
