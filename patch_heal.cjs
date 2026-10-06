const fs = require('fs');

let data = JSON.parse(fs.readFileSync('public/data.json', 'utf8'));
let healMove = data.BOSSES.mega_treant.moves.find(m => m.n === "Heal");
if (healMove) {
    healMove.effect.target = "ally";
}

fs.writeFileSync('public/data.json', JSON.stringify(data, null, 2));
console.log("Patched Heal!");
