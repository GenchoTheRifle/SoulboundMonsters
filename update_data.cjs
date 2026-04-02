const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

for (const key in data.STARTERS) {
    data.STARTERS[key].startingEnergy = 1;
}

for (const merge of data.MERGES) {
    merge.startingEnergy = 1;
}

for (const key in data.BOSSES) {
    data.BOSSES[key].startingEnergy = 1;
}

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('Updated data.json');
