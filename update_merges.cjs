const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const mergesData = {
  "Alpha Wolf": {
    hp: 24, matk: 14, mdef: 8, ratk: 0, rdef: 7, spd: 13, startingEnergy: 1,
    moves: [
      { n: "Alpha Bite", c: 1, t: "Beast", p: 1.2, melee: true },
      { n: "Alpha Howl", c: 1, t: "Beast", p: 0, effect: { type: "atk_buff_pct", value: 0.4, turns: 3, target: "self" } },
      { n: "Intimidate", c: 1, t: "Beast", p: 0, effect: { type: "atk_debuff_pct", value: 0.3, turns: 2, target: "enemy" } }
    ]
  },
  "Elder Bear": {
    hp: 26, matk: 15, mdef: 13, ratk: 0, rdef: 8, spd: 5, startingEnergy: 1,
    moves: [
      { n: "Elder Maul", c: 1, t: "Beast", p: 1.3, melee: true },
      { n: "Elder Guard", c: 1, t: "Beast", p: 0, effect: { type: "guard_pct", value: 0.5, turns: 1, target: "self" } },
      { n: "Intimidate", c: 1, t: "Beast", p: 0, effect: { type: "atk_debuff_pct", value: 0.3, turns: 2, target: "enemy" } }
    ]
  },
  "King Slime": {
    hp: 22, matk: 0, mdef: 12, ratk: 9, rdef: 8, spd: 6, startingEnergy: 2,
    moves: [
      { n: "King Spit", c: 1, t: "Nature", p: 1.1, ranged: true },
      { n: "King Heal", c: 2, t: "Nature", p: 0, effect: { type: "heal_flat", value: 10, target: "ally" } },
      { n: "Renewal Spores", c: 3, t: "Nature", p: 0, effect: { type: "regen_flat", value: 4, turns: 3, target: "all_allies" } }
    ]
  },
  "Giant Mushroom": {
    hp: 24, matk: 0, mdef: 8, ratk: 13, rdef: 9, spd: 9, startingEnergy: 1,
    moves: [
      { n: "Giant Spore", c: 1, t: "Nature", p: 0.9, ranged: true, effect: { type: "sleep", chance: 0.3, turns: 2, target: "enemy" } },
      { n: "Giant Poison Cloud", c: 3, t: "Nature", p: 0, ranged: true, effect: { type: "poison_pct", value: 0.12, turns: 4, target: "all_enemies" } },
      { n: "Toxin", c: 2, t: "Nature", p: 0, ranged: true, effect: { type: "poison_pct", value: 0.15, turns: 3, target: "enemy" } }
    ]
  },
  "Elite Sentry": {
    hp: 23, matk: 0, mdef: 9, ratk: 11, rdef: 12, spd: 9, startingEnergy: 1,
    moves: [
      { n: "Elite Snipe", c: 1, t: "Mech", p: 1.3, ranged: true },
      { n: "Elite Stun Bolt", c: 2, t: "Mech", p: 0, ranged: true, effect: { type: "stun", chance: 1.0, turns: 2, target: "enemy" } },
      { n: "Bulletstorm", c: 2, t: "Mech", p: 0.7, hits: 3, ranged: true }
    ]
  },
  "Ultimate Spark-Bot": {
    hp: 20, matk: 0, mdef: 6, ratk: 15, rdef: 10, spd: 15, startingEnergy: 1,
    moves: [
      { n: "Ultimate Zap", c: 1, t: "Mech", p: 1.1, ranged: true, effect: { type: "stun", chance: 0.25, turns: 1, target: "enemy" } },
      { n: "Ultimate Overcharge", c: 1, t: "Mech", p: 0, effect: { type: "spd_buff_pct", value: 0.3, turns: 3, target: "self" } },
      { n: "Shockwave", c: 3, t: "Mech", p: 1.2, ranged: true, effect: { type: "stun", chance: 0.2, turns: 1, target: "all_enemies" } }
    ]
  },
  "Bearwolf": {
    hp: 24, matk: 14, mdef: 10, ratk: 0, rdef: 6, spd: 8, startingEnergy: 1,
    moves: [
      { n: "Devour", c: 1, t: "Beast", p: 1.3, melee: true },
      { n: "Savage Stance", c: 2, t: "Beast", p: 0, effect: { type: "savage_stance_pct", atk_value: 0.4, atk_turns: 3, guard_value: 0.4, guard_turns: 1, target: "self" } },
      { n: "Intimidate", c: 1, t: "Beast", p: 0, effect: { type: "atk_debuff_pct", value: 0.3, turns: 2, target: "enemy" } }
    ]
  },
  "Slimy Wolf": {
    hp: 20, matk: 12, mdef: 7, ratk: 7, rdef: 6, spd: 9, startingEnergy: 1,
    moves: [
      { n: "Bite", c: 1, t: "Beast", p: 1.0, melee: true },
      { n: "Spit", c: 1, t: "Nature", p: 1.0, ranged: true },
      { n: "Howl", c: 1, t: "Beast", p: 0, effect: { type: "atk_buff_pct", value: 0.4, turns: 3, target: "self" } },
      { n: "Heal", c: 2, t: "Nature", p: 0, effect: { type: "heal_flat", value: 6, target: "ally" } }
    ]
  },
  "Spore Wolf": {
    hp: 22, matk: 9, mdef: 6, ratk: 8, rdef: 6, spd: 9, startingEnergy: 1,
    moves: [
      { n: "Bite", c: 1, t: "Beast", p: 1.0, melee: true },
      { n: "Spore", c: 1, t: "Nature", p: 0.7, ranged: true, effect: { type: "sleep", chance: 0.2, turns: 2, target: "enemy" } },
      { n: "Howl", c: 1, t: "Beast", p: 0, effect: { type: "atk_buff_pct", value: 0.4, turns: 3, target: "self" } },
      { n: "Poison Cloud", c: 2, t: "Nature", p: 0, ranged: true, effect: { type: "poison_pct", value: 0.1, turns: 3, target: "all_enemies" } }
    ]
  },
  "Iron Wolf": {
    hp: 24, matk: 8, mdef: 6, ratk: 10, rdef: 7, spd: 9, startingEnergy: 1,
    moves: [
      { n: "Bite", c: 1, t: "Beast", p: 1.0, melee: true },
      { n: "Snipe", c: 1, t: "Mech", p: 1.2, ranged: true },
      { n: "Howl", c: 1, t: "Beast", p: 0, effect: { type: "atk_buff_pct", value: 0.4, turns: 3, target: "self" } },
      { n: "Stun Bolt", c: 2, t: "Mech", p: 0, ranged: true, effect: { type: "stun", chance: 1.0, turns: 1, target: "enemy" } }
    ]
  },
  "Spark Wolf": {
    hp: 20, matk: 10, mdef: 5, ratk: 12, rdef: 8, spd: 11, startingEnergy: 1,
    moves: [
      { n: "Bite", c: 1, t: "Beast", p: 1.0, melee: true },
      { n: "Zap", c: 1, t: "Mech", p: 1.0, ranged: true, effect: { type: "stun", chance: 0.15, turns: 1, target: "enemy" } },
      { n: "Howl", c: 1, t: "Beast", p: 0, effect: { type: "atk_buff_pct", value: 0.4, turns: 3, target: "self" } },
      { n: "Overcharge", c: 1, t: "Mech", p: 0, effect: { type: "spd_buff_pct", value: 0.2, turns: 2, target: "self" } }
    ]
  },
  "Mossy Bear": {
    hp: 22, matk: 10, mdef: 9, ratk: 7, rdef: 9, spd: 6, startingEnergy: 1,
    moves: [
      { n: "Maul", c: 1, t: "Beast", p: 1.2, melee: true },
      { n: "Spit", c: 1, t: "Nature", p: 1.0, ranged: true },
      { n: "Guard", c: 1, t: "Beast", p: 0, effect: { type: "guard_pct", value: 0.5, turns: 1, target: "self" } },
      { n: "Heal", c: 2, t: "Nature", p: 0, effect: { type: "heal_flat", value: 6, target: "ally" } }
    ]
  },
  "Fungal Bear": {
    hp: 25, matk: 10, mdef: 8, ratk: 8, rdef: 7, spd: 7, startingEnergy: 1,
    moves: [
      { n: "Maul", c: 1, t: "Beast", p: 1.2, melee: true },
      { n: "Spore", c: 1, t: "Nature", p: 0.7, ranged: true, effect: { type: "sleep", chance: 0.2, turns: 2, target: "enemy" } },
      { n: "Guard", c: 1, t: "Beast", p: 0, effect: { type: "guard_pct", value: 0.5, turns: 1, target: "self" } },
      { n: "Poison Cloud", c: 2, t: "Nature", p: 0, ranged: true, effect: { type: "poison_pct", value: 0.1, turns: 3, target: "all_enemies" } }
    ]
  },
  "Artillery Bear": {
    hp: 22, matk: 8, mdef: 7, ratk: 12, rdef: 8, spd: 7, startingEnergy: 1,
    moves: [
      { n: "Maul", c: 1, t: "Beast", p: 1.2, melee: true },
      { n: "Snipe", c: 1, t: "Mech", p: 1.2, ranged: true },
      { n: "Guard", c: 1, t: "Beast", p: 0, effect: { type: "guard_pct", value: 0.5, turns: 1, target: "self" } },
      { n: "Stun Bolt", c: 2, t: "Mech", p: 0, ranged: true, effect: { type: "stun", chance: 1.0, turns: 1, target: "enemy" } }
    ]
  },
  "Plasma Bear": {
    hp: 20, matk: 7, mdef: 7, ratk: 14, rdef: 8, spd: 9, startingEnergy: 1,
    moves: [
      { n: "Maul", c: 1, t: "Beast", p: 1.2, melee: true },
      { n: "Zap", c: 1, t: "Mech", p: 1.0, ranged: true, effect: { type: "stun", chance: 0.15, turns: 1, target: "enemy" } },
      { n: "Guard", c: 1, t: "Beast", p: 0, effect: { type: "guard_pct", value: 0.5, turns: 1, target: "self" } },
      { n: "Overcharge", c: 1, t: "Mech", p: 0, effect: { type: "spd_buff_pct", value: 0.2, turns: 2, target: "self" } }
    ]
  },
  "Mycelium Ooze": {
    hp: 20, matk: 0, mdef: 10, ratk: 10, rdef: 10, spd: 7, startingEnergy: 2,
    moves: [
      { n: "Slumber Sludge", c: 1, t: "Nature", p: 0.8, ranged: true, effect: { type: "sleep", chance: 0.25, turns: 2, target: "enemy" } },
      { n: "Toxin", c: 2, t: "Nature", p: 0, ranged: true, effect: { type: "poison_pct", value: 0.15, turns: 3, target: "enemy" } },
      { n: "Renewal Spores", c: 3, t: "Nature", p: 0, effect: { type: "regen_flat", value: 4, turns: 3, target: "all_allies" } }
    ]
  },
  "Bio-Tank": {
    hp: 26, matk: 0, mdef: 10, ratk: 8, rdef: 10, spd: 6, startingEnergy: 1,
    moves: [
      { n: "Spit", c: 1, t: "Nature", p: 1.0, ranged: true },
      { n: "Snipe", c: 1, t: "Mech", p: 1.2, ranged: true },
      { n: "Heal", c: 2, t: "Nature", p: 0, effect: { type: "heal_flat", value: 6, target: "ally" } },
      { n: "Stun Bolt", c: 2, t: "Mech", p: 0, ranged: true, effect: { type: "stun", chance: 1.0, turns: 1, target: "enemy" } }
    ]
  },
  "Pulse Slime": {
    hp: 18, matk: 0, mdef: 8, ratk: 14, rdef: 8, spd: 10, startingEnergy: 1,
    moves: [
      { n: "Spit", c: 1, t: "Nature", p: 1.0, ranged: true },
      { n: "Zap", c: 1, t: "Mech", p: 1.0, ranged: true, effect: { type: "stun", chance: 0.15, turns: 1, target: "enemy" } },
      { n: "Heal", c: 2, t: "Nature", p: 0, effect: { type: "heal_flat", value: 6, target: "ally" } },
      { n: "Overcharge", c: 1, t: "Mech", p: 0, effect: { type: "spd_buff_pct", value: 0.2, turns: 2, target: "self" } }
    ]
  },
  "Rooted Cannon": {
    hp: 20, matk: 0, mdef: 6, ratk: 16, rdef: 6, spd: 8, startingEnergy: 1,
    moves: [
      { n: "Spore", c: 1, t: "Nature", p: 0.7, ranged: true, effect: { type: "sleep", chance: 0.2, turns: 2, target: "enemy" } },
      { n: "Snipe", c: 1, t: "Mech", p: 1.2, ranged: true },
      { n: "Poison Cloud", c: 2, t: "Nature", p: 0, ranged: true, effect: { type: "poison_pct", value: 0.1, turns: 3, target: "all_enemies" } },
      { n: "Stun Bolt", c: 2, t: "Mech", p: 0, ranged: true, effect: { type: "stun", chance: 1.0, turns: 1, target: "enemy" } }
    ]
  },
  "Neon Shroom": {
    hp: 19, matk: 0, mdef: 6, ratk: 15, rdef: 7, spd: 10, startingEnergy: 1,
    moves: [
      { n: "Spore", c: 1, t: "Nature", p: 0.7, ranged: true, effect: { type: "sleep", chance: 0.2, turns: 2, target: "enemy" } },
      { n: "Zap", c: 1, t: "Mech", p: 1.0, ranged: true, effect: { type: "stun", chance: 0.15, turns: 1, target: "enemy" } },
      { n: "Poison Cloud", c: 2, t: "Nature", p: 0, ranged: true, effect: { type: "poison_pct", value: 0.1, turns: 3, target: "all_enemies" } },
      { n: "Overcharge", c: 1, t: "Mech", p: 0, effect: { type: "spd_buff_pct", value: 0.2, turns: 2, target: "self" } }
    ]
  },
  "Assault Mech": {
    hp: 20, matk: 0, mdef: 6, ratk: 12, rdef: 9, spd: 10, startingEnergy: 2,
    moves: [
      { n: "Bulletstorm", c: 2, t: "Mech", p: 0.7, hits: 3, ranged: true },
      { n: "Shockwave", c: 3, t: "Mech", p: 1.2, ranged: true, effect: { type: "stun", chance: 0.2, turns: 1, target: "all_enemies" } },
      { n: "Full Throttle", c: 1, t: "Mech", p: 0, effect: { type: "spd_buff_pct", value: 0.2, turns: 2, target: "all_allies" } }
    ]
  }
};

data.MERGES = data.MERGES.map(m => {
  if (mergesData[m.name]) {
    return { ...m, ...mergesData[m.name] };
  }
  return m;
});

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log("Merges updated!");
