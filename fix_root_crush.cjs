const fs = require('fs');
let data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const categories = ['STARTERS', 'MERGES', 'BOSSES'];
for (const cat of categories) {
    if (!data[cat]) continue;
    const items = Array.isArray(data[cat]) ? data[cat] : Object.values(data[cat]);
    for (const item of items) {
        if (!item.moves) continue;
        for (const move of item.moves) {
            if (move.n === "Root Crush") {
                // AoE Damage to all enemies, 15% chance to stun
                move.effect = {
                    type: "stun",
                    chance: 0.15,
                    turns: 1,
                    target: "all_enemies"
                };
            }
        }
    }
}
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
