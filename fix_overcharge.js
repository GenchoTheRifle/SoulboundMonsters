import fs from 'fs';
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const categories = ['STARTERS', 'MERGES', 'BOSSES'];

for (const cat of categories) {
    for (const key in data[cat]) {
        const monster = data[cat][key];
        if (monster.moves) {
            for (const move of monster.moves) {
                if (move.n === 'Overcharge') {
                    move.effect.turns = 3;
                } else if (move.n === 'Ultimate Overcharge') {
                    move.c = 2;
                    move.effect = {
                        type: 'ultimate_overcharge',
                        atk_value: 0.2,
                        spd_value: 0.3,
                        turns: 3,
                        target: 'self'
                    };
                }
            }
        }
    }
}

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Done');
