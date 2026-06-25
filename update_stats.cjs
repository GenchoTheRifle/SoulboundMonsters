const fs = require('fs');

const dataStr = fs.readFileSync('data.json', 'utf8');
const data = JSON.parse(dataStr);

const updates = [
  { name: "Slimy Wolf", hp: 75, matk: 22, mdef: 18, ratk: 18, rdef: 18, spd: 9, startingEnergy: 1 },
  { name: "Iron Wolf", hp: 70, matk: 20, mdef: 15, ratk: 20, rdef: 22, spd: 10, startingEnergy: 1 },
  { name: "Alpha Wolf", hp: 65, matk: 26, mdef: 14, ratk: 0, rdef: 14, spd: 11, startingEnergy: 1 },
  { name: "King Slime", hp: 75, matk: 0, mdef: 20, ratk: 18, rdef: 20, spd: 7, startingEnergy: 2 },
  { name: "Elite Sentry", hp: 70, matk: 0, mdef: 16, ratk: 22, rdef: 22, spd: 8, startingEnergy: 1 },
  { name: "Bio-Tank", hp: 85, matk: 0, mdef: 20, ratk: 18, rdef: 20, spd: 6, startingEnergy: 1 }
];

updates.forEach(u => {
  if (data.MERGES) {
    const merge = data.MERGES.find(m => m.name === u.name);
    if (merge) {
      merge.hp = u.hp;
      merge.matk = u.matk;
      merge.mdef = u.mdef;
      merge.ratk = u.ratk;
      merge.rdef = u.rdef;
      merge.spd = u.spd;
      merge.startingEnergy = u.startingEnergy;
    }
  }
});

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Stats updated');
