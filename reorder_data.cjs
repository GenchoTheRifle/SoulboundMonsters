const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

function reorderMonster(m) {
    return {
        id: m.id,
        name: m.name,
        type: m.type,
        hp: m.hp,
        spd: m.spd,
        matk: m.matk !== undefined ? m.matk : (m.atk || 10),
        mdef: m.mdef !== undefined ? m.mdef : 5,
        ratk: m.ratk !== undefined ? m.ratk : (m.atk || 10),
        rdef: m.rdef !== undefined ? m.rdef : 5,
        moves: m.moves,
        art: m.art,
        startingEnergy: m.startingEnergy
    };
}

for (const key in data.STARTERS) {
    data.STARTERS[key] = reorderMonster(data.STARTERS[key]);
}

data.MERGES = data.MERGES.map(m => {
    const rm = reorderMonster(m);
    rm.parents = m.parents;
    return rm;
});

for (const key in data.BOSSES) {
    data.BOSSES[key] = reorderMonster(data.BOSSES[key]);
}

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log("Data reordered!");
