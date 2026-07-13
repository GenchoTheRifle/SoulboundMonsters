const fs = require('fs');
let data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const categories = ['STARTERS', 'MERGES', 'BOSSES'];
for (const cat of categories) {
    if (!data[cat]) continue;
    const items = Array.isArray(data[cat]) ? data[cat] : Object.values(data[cat]);
    for (const item of items) {
        if (!item.moves) continue;
        for (const move of item.moves) {
            if (move.n === "Savage Stance") {
                if (move.effect) {
                    move.effect.atk_turns = 4;
                }
            }
        }
    }
}
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
