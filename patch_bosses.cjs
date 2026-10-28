const fs = require('fs');

let data = JSON.parse(fs.readFileSync('public/data.json', 'utf8'));

for (let key in data.BOSSES) {
    data.BOSSES[key].spd = 9;
}

fs.writeFileSync('public/data.json', JSON.stringify(data, null, 2));
console.log("Patched bosses speed!");
