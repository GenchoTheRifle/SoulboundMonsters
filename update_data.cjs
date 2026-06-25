const fs = require('fs');

const dataStr = fs.readFileSync('data.json', 'utf8');
const data = JSON.parse(dataStr);

const startersMap = data.STARTERS || {};
const mergesArray = data.MERGES || [];

const basicMoves = [
  'Bite', 'Spit', 'Snipe', 'Maul', 'Spore', 
  'Zap', 'Screech', 'Slam', 'Punch'
];

function updateMoves(moves, isStarter) {
  if (!moves) return;
  moves.forEach(m => {
    // 1. Basic moves
    if (basicMoves.includes(m.n)) {
      m.p = isStarter ? 1.0 : 1.2;
    }
    
    // 2. Heal
    if (m.n === 'Heal') {
      if (m.effect && m.effect.type === 'heal_flat') {
        m.effect.type = 'heal_pct';
        m.effect.value = 0.15;
      }
    }
    
    // 3. King Spit
    if (m.n === 'King Spit') {
      m.p = 1.4;
    }
    
    // 4. King Heal
    if (m.n === 'King Heal') {
      m.effect.type = 'heal_pct';
      m.effect.value = 0.30;
    }
    
    // 5. Renewal Spores
    if (m.n === 'Renewal Spores') {
      m.effect.type = 'regen_pct';
      m.effect.turns = 3;
      m.effect.value = 0.15;
    }
    
    // 6. Slumber Sludge
    if (m.n === 'Slumber Sludge') {
      m.p = 1.2;
    }
    
    // 7. Toxin
    if (m.n === 'Toxin' && m.effect) {
      m.effect.type = 'poison_pct';
      m.effect.value = 0.15;
    }
    
    // 8. Flat Poison
    if (m.effect && m.effect.type === 'poison_flat') {
      m.effect.value = 8;
    }
  });
}

Object.values(startersMap).forEach(s => updateMoves(s.moves, true));
mergesArray.forEach(m => updateMoves(m.moves, false));

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Done!');
