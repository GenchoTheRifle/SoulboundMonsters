const fs = require('fs');
let data = JSON.parse(fs.readFileSync('public/data.json', 'utf8'));

for (let key in data.STARTERS) {
    let m = data.STARTERS[key];
    if (m.moves) {
        for (let move of m.moves) {
            if (move.n === 'Spore' && move.effect && move.effect.type === 'sleep') {
                move.effect.chance = 0.15;
            } else if (move.n === 'Slumber Sludge' && move.effect && move.effect.type === 'sleep') {
                move.effect.chance = 0.2;
            } else if (move.n === 'Giant Spore' && move.effect && move.effect.type === 'sleep') {
                move.effect.chance = 0.3;
            }
        }
    }
}
for (let key in data.MERGES) {
    let m = data.MERGES[key];
    if (m.moves) {
        for (let move of m.moves) {
            if (move.n === 'Spore' && move.effect && move.effect.type === 'sleep') {
                move.effect.chance = 0.15;
            } else if (move.n === 'Slumber Sludge' && move.effect && move.effect.type === 'sleep') {
                move.effect.chance = 0.2;
            } else if (move.n === 'Giant Spore' && move.effect && move.effect.type === 'sleep') {
                move.effect.chance = 0.3;
            }
        }
    }
}
for (let key in data.BOSSES) {
    let m = data.BOSSES[key];
    if (m.moves) {
        for (let move of m.moves) {
            if (move.n === 'Spore' && move.effect && move.effect.type === 'sleep') {
                move.effect.chance = 0.15;
            } else if (move.n === 'Slumber Sludge' && move.effect && move.effect.type === 'sleep') {
                move.effect.chance = 0.2;
            } else if (move.n === 'Giant Spore' && move.effect && move.effect.type === 'sleep') {
                move.effect.chance = 0.3;
            }
        }
    }
}

fs.writeFileSync('public/data.json', JSON.stringify(data, null, 2));
