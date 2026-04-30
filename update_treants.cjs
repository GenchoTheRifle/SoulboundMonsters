const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Update Treant
data.STARTERS['tree'].name = "Treant";
data.STARTERS['tree'].art = "Art/Treant.png";
data.STARTERS['tree'].moves = [
  {
    "n": "Slam",
    "c": 1,
    "t": "Nature",
    "p": 1.0,
    "melee": true
  },
  {
    "n": "Brambles",
    "c": 1,
    "t": "Nature",
    "p": 0,
    "effect": {
      "type": "brambles",
      "value": 0.2,
      "turns": 3,
      "target": "self"
    }
  }
];

// Add Colossal Treant to merges
const colossalTreant = {
  "name": "Colossal Treant",
  "hp": 40,
  "spd": 4,
  "matk": 18,
  "mdef": 18,
  "ratk": 0,
  "rdef": 15,
  "moves": [
    {
      "n": "Colossal Slam",
      "c": 1,
      "t": "Nature",
      "p": 1.2,
      "melee": true
    },
    {
      "n": "Colossal Brambles",
      "c": 1,
      "t": "Nature",
      "p": 0,
      "effect": {
        "type": "brambles",
        "value": 0.3,
        "turns": 3,
        "target": "self"
      }
    },
    {
      "n": "Root Crush",
      "c": 2,
      "t": "Nature",
      "p": 0.6,
      "melee": false,
      "hits": 1,
      "effect": {
        "type": "spd_debuff_pct",
        "value": 0.25,
        "turns": 2,
        "target": "all_enemies"
      }
    }
  ],
  "art": "Art/Colossal Treant.png",
  "startingEnergy": 2,
  "parents": [
    "tree",
    "tree"
  ]
};

data.MERGES.push(colossalTreant);

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
