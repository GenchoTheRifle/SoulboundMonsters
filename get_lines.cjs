const fs = require('fs');
let lines = fs.readFileSync('src/combat.js', 'utf8').split('\n');

const nums = [859, 879, 923, 1105, 1114, 1203, 1238, 1326, 1375];
nums.forEach(n => {
    console.log(`Line ${n}:`);
    for (let i = n - 5; i <= n + 2; i++) {
        if(lines[i]) console.log(lines[i].trim());
    }
    console.log('---');
});
