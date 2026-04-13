import fs from 'fs';
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const categories = ['STARTERS', 'MERGES', 'BOSSES'];

for (const cat of categories) {
    for (const key in data[cat]) {
        const monster = data[cat][key];
        if (monster.moves) {
            for (const move of monster.moves) {
                if (move.n === 'Poison Cloud') {
                    move.effect.type = 'poison_flat';
                    move.effect.value = 4;
                } else if (move.n === 'Giant Poison Cloud') {
                    move.effect.type = 'poison_flat';
                    move.effect.value = 8;
                }
            }
        }
    }
}

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Done');
