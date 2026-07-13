const fs = require('fs');
let data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const categories = ['STARTERS', 'MERGES', 'BOSSES'];
for (const cat of categories) {
    if (!data[cat]) continue;
    const items = Array.isArray(data[cat]) ? data[cat] : Object.values(data[cat]);
    for (const item of items) {
        if (!item.moves) continue;
        for (const move of item.moves) {
            if (move.n === "Full Throttle") {
                move.effect = {
                    type: "overcharge_buff",
                    value: 0.2,
                    turns: 3,
                    target: "all_allies"
                };
            }
        }
    }
}
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
