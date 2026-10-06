const fs = require('fs');
let data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));

data.STARTERS['mech_melee'] = {
  "id": "mech_melee",
  "name": "Robot",
  "type": "Mech",
  "hp": 20,
  "spd": 9,
  "matk": 8,
  "mdef": 10,
  "ratk": 0,
  "rdef": 10,
  "moves": [
    {
      "n": "Punch",
      "c": 1,
      "t": "Mech",
      "p": 1.0,
      "melee": true
    },
    {
      "n": "Counter",
      "c": 2,
      "t": "Mech",
      "p": 0,
      "effect": {
        "type": "counter",
        "value": 1.0,
        "turns": 1,
        "target": "self"
      }
    }
  ],
  "art": "Art/Robot.png",
  "startingEnergy": 1
};

// Add Heavy Robot
data.MERGES.push({
  "name": "Heavy Robot",
  "hp": 26,
  "spd": 7,
  "matk": 10,
  "mdef": 12,
  "ratk": 0,
  "rdef": 12,
  "moves": [
    {
      "n": "Heavy Punch",
      "c": 1,
      "t": "Mech",
      "p": 1.2,
      "melee": true
    },
    {
      "n": "Heavy Counter",
      "c": 2,
      "t": "Mech",
      "p": 0,
      "effect": {
        "type": "counter",
        "value": 2.0,
        "turns": 1,
        "target": "self"
      }
    },
    {
      "n": "Taunt",
      "c": 1,
      "t": "Mech",
      "p": 0,
      "effect": {
        "type": "taunt",
        "turns": 1,
        "target": "self"
      }
    }
  ],
  "art": "Art/Heavy Robot.png",
  "startingEnergy": 1,
  "parents": ["mech_melee", "mech_melee"]
});

// The rest of the wood fusions
const fusions = [
  {
    name: "Timber Wolf", hp: 22, matk: 10, mdef: 8, ratk: 0, rdef: 8, spd: 8, energy: 2, 
    parents: ["wolf", "tree"], art: "Art/Timber Wolf.png"
  },
  {
    name: "Thorn Bear", hp: 25, matk: 11, mdef: 10, ratk: 0, rdef: 10, spd: 5, energy: 1, 
    parents: ["bear", "tree"], art: "Art/Thorn Bear.png"
  },
  {
    name: "Blight Wood", hp: 30, matk: 8, mdef: 8, ratk: 8, rdef: 8, spd: 3, energy: 1, 
    parents: ["slime", "tree"], art: "Art/Blight Wood.png"
  },
  {
    name: "Deathcap Wood", hp: 24, matk: 9, mdef: 9, ratk: 10, rdef: 8, spd: 6, energy: 1, 
    parents: ["mushroom", "tree"], art: "Art/Deathcap Wood.png"
  },
  {
    name: "Root Cyborg", hp: 25, matk: 8, mdef: 8, ratk: 9, rdef: 7, spd: 9, energy: 1, 
    parents: ["sparkbot", "tree"], art: "Art/Root Cyborg.png"
  },
  {
    name: "Bark Hunter", hp: 22, matk: 6, mdef: 6, ratk: 15, rdef: 6, spd: 9, energy: 1, 
    parents: ["sentry", "tree"], art: "Art/Bark Hunter.png"
  },
  {
    name: "Forest Stalker", hp: 23, matk: 13, mdef: 10, ratk: 7, rdef: 6, spd: 8, energy: 1, 
    parents: ["bat", "tree"], art: "Art/Forest Stalker.png"
  }
];

for(const f of fusions) {
  // get parent moves
  const p1 = data.STARTERS[f.parents[0]];
  const p2 = data.STARTERS[f.parents[1]];
  let moves = [];
  if (p1 && p2) {
      // Just concatenate them
      // They just said "It has the moves from both"
      // Deep copy to prevent reference issues
      moves = JSON.parse(JSON.stringify(p1.moves.concat(p2.moves)));
  }
  
  data.MERGES.push({
    "name": f.name,
    "hp": f.hp,
    "spd": f.spd,
    "matk": f.matk,
    "mdef": f.mdef,
    "ratk": f.ratk,
    "rdef": f.rdef,
    "moves": moves,
    "art": f.art,
    "startingEnergy": f.energy,
    "parents": f.parents
  });
}

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
