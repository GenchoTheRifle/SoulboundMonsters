const fs = require('fs');

const dataStr = fs.readFileSync('data.json', 'utf8');
const data = JSON.parse(dataStr);

const startersMap = data.STARTERS || {};
const mergesArray = data.MERGES || [];

function updateMoves(moves) {
  if (!moves) return;
  moves.forEach(m => {
    if (m.n === 'Howl' && m.effect) {
      m.effect.value = 0.3;
    }
    if (m.n === 'Thorns' && m.effect && m.effect.type === 'brambles') {
      m.effect.value = 10;
    }
  });
}

Object.values(startersMap).forEach(s => updateMoves(s.moves));
mergesArray.forEach(m => updateMoves(m.moves));

if (data.wolf) updateMoves(data.wolf.moves); // just in case it's flat struct

for (const key in data) {
  if (data[key] && data[key].moves) {
    updateMoves(data[key].moves);
  }
}

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Done altering Howl and Thorns!');
