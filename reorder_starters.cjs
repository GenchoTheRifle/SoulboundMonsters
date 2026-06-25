const fs = require('fs');
let data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));

let newOrder = ['wolf', 'slime', 'sentry', 'bear', 'mushroom', 'sparkbot', 'bat', 'tree', 'mech_melee'];
let newStarters = {};

for (let key of newOrder) {
    if (data.STARTERS[key]) {
        newStarters[key] = data.STARTERS[key];
    }
}

// Ensure any missing ones are added at the end
for (let key in data.STARTERS) {
    if (!newStarters[key]) {
        newStarters[key] = data.STARTERS[key];
    }
}

data.STARTERS = newStarters;

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
