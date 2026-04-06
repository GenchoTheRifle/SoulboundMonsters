const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Update moves for starters
data.STARTERS.wolf.moves = [
    { n: "Bite", c: 1, t: "Beast", p: 1 },
    { n: "Howl", c: 1, t: "Beast", p: 0, effect: { type: "atk_buff", value: 3, turns: 3, target: "self" } }
];

data.STARTERS.bear.moves = [
    { n: "Maul", c: 1, t: "Beast", p: 1 },
    { n: "Guard", c: 1, t: "Beast", p: 0, effect: { type: "guard", value: 0.5, turns: 1, target: "self" } }
];

data.STARTERS.slime.moves = [
    { n: "Spit", c: 1, t: "Nature", p: 1 },
    { n: "Heal", c: 2, t: "Nature", p: 1.5, effect: { type: "heal", target: "ally" } }
];

data.STARTERS.mushroom.moves = [
    { n: "Spore", c: 1, t: "Nature", p: 1, effect: { type: "sleep", chance: 0.3, turns: 2 } },
    { n: "Poison Cloud", c: 2, t: "Nature", p: 0, effect: { type: "poison", value: 4, turns: 3, target: "all_enemies" } }
];

data.STARTERS.sentry.moves = [
    { n: "Snipe", c: 1, t: "Mech", p: 1 },
    { n: "Stun Bolt", c: 2, t: "Mech", p: 0, effect: { type: "stun", chance: 1.0, turns: 1 } }
];

data.STARTERS.sparkbot.moves = [
    { n: "Zap", c: 1, t: "Mech", p: 1, effect: { type: "stun", chance: 0.2, turns: 1 } },
    { n: "Overcharge", c: 1, t: "Mech", p: 0, effect: { type: "spd_buff", value: 3, turns: 2, target: "self" } }
];

// Helper to find move by name
function getMove(name) {
    const allMoves = [
        ...data.STARTERS.wolf.moves,
        ...data.STARTERS.bear.moves,
        ...data.STARTERS.slime.moves,
        ...data.STARTERS.mushroom.moves,
        ...data.STARTERS.sentry.moves,
        ...data.STARTERS.sparkbot.moves,
        { n: "Devour", c: 1, t: "Beast", p: 1.2 },
        { n: "Savage Stance", c: 2, t: "Beast", p: 0, effect: { type: "savage_stance", atk_value: 4, atk_turns: 3, guard_value: 0.5, guard_turns: 1, target: "self" } },
        { n: "Intimidate", c: 1, t: "Beast", p: 0, effect: { type: "atk_debuff", value: 3, turns: 2 } },
        { n: "Slumber Sludge", c: 2, t: "Nature", p: 1, effect: { type: "sleep", chance: 0.5, turns: 2 } },
        { n: "Toxin", c: 2, t: "Nature", p: 0, effect: { type: "poison", value: 8, turns: 3 } },
        { n: "Renewal Spores", c: 3, t: "Nature", p: 0, effect: { type: "regen", value: 5, turns: 3, target: "all_allies" } },
        { n: "Bulletstorm", c: 3, t: "Mech", p: 2 },
        { n: "Shockwave", c: 2, t: "Mech", p: 0.8, effect: { type: "stun", chance: 0.3, turns: 1, target: "all_enemies" } },
        { n: "Full Throttle", c: 2, t: "Mech", p: 0, effect: { type: "spd_buff", value: 4, turns: 3, target: "all_allies" } }
    ];
    return allMoves.find(m => m.n === name);
}

const mergeMoves = {
    "Bearwolf": ["Devour", "Savage Stance", "Intimidate"],
    "Slimy Wolf": ["Bite", "Spit", "Howl", "Heal"],
    "Spore Wolf": ["Bite", "Spore", "Howl", "Poison Cloud"],
    "Iron Wolf": ["Bite", "Snipe", "Howl", "Stun Bolt"],
    "Spark Wolf": ["Bite", "Zap", "Howl", "Overcharge"],
    "Mossy Bear": ["Maul", "Spit", "Guard", "Heal"],
    "Fungal Bear": ["Maul", "Spore", "Guard", "Poison Cloud"],
    "Artillery Bear": ["Maul", "Snipe", "Guard", "Stun Bolt"],
    "Plasma Bear": ["Maul", "Zap", "Guard", "Overcharge"],
    "Mycelium Ooze": ["Slumber Sludge", "Toxin", "Renewal Spores"],
    "Bio-Tank": ["Spit", "Snipe", "Heal", "Stun Bolt"],
    "Pulse Slime": ["Spit", "Zap", "Heal", "Overcharge"],
    "Rooted Cannon": ["Spore", "Snipe", "Poison Cloud", "Stun Bolt"],
    "Neon Shroom": ["Spore", "Zap", "Poison Cloud", "Overcharge"],
    "Assault Mech": ["Bulletstorm", "Shockwave", "Full Throttle"]
};

data.MERGES.forEach(m => {
    if (mergeMoves[m.name]) {
        m.moves = mergeMoves[m.name].map(name => getMove(name));
    }
});

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('data.json updated');
