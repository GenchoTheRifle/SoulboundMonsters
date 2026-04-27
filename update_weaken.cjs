const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

if (data.BOSSES['mega_bat']?.moves) {
  const move = data.BOSSES['mega_bat'].moves.find(m => m.n === 'Hemorrhage');
  if (move && move.effect) {
    move.effect.type = 'atk_debuff_pct';
  }
}

const megaBatMerge = data.MERGES.find(m => m.name === 'Mega Bat');
if (megaBatMerge?.moves) {
  const move = megaBatMerge.moves.find(m => m.n === 'Hemorrhage');
  if (move && move.effect) {
    move.effect.type = 'atk_debuff_pct';
  }
}

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Done.');
