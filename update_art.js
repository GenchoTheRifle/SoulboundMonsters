const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const nameToArt = {
  "Alpha Wolf": "/Art/Alpha Wolf.png",
  "Elder Bear": "/Art/Elder Bear.png",
  "King Slime": "/Art/King Slime.png",
  "Giant Mushroom": "/Art/Giant Mushroom.png",
  "Elite Sentry": "/Art/Elite Sentry.png",
  "Ultimate Spark-Bot": "/Art/Ultimate Spark-bot.png",
  "Bearwolf": "/Art/Bearwolf.png",
  "Slimy Wolf": "/Art/Slimy Wolf.png",
  "Spore Wolf": "/Art/Spore Wolf.png",
  "Iron Wolf": "/Art/Iron Wolf.png",
  "Spark Wolf": "/Art/Spark Wolf.png",
  "Mossy Bear": "/Art/Mossy Bear.png",
  "Fungal Bear": "/Art/Fungal Bear.png",
  "Artillery Bear": "/Art/Artillery Bear.png",
  "Plasma Bear": "/Art/Plasma Bear.png",
  "Mycelium Ooze": "/Art/Mycelium Ooze.png",
  "Bio-Tank": "/Art/Bio-Tank.png",
  "Pulse Slime": "/Art/Pulse Slime.png",
  "Rooted Cannon": "/Art/Rooted Cannon.png",
  "Neon Shroom": "/Art/Neon Shroom.png",
  "Assault Mech": "/Art/Assault Mech.png"
};

data.MERGES.forEach(merge => {
  if (nameToArt[merge.name]) {
    merge.art = nameToArt[merge.name];
  }
});

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Updated data.json');
