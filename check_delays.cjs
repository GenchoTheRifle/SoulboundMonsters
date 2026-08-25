const fs = require('fs');
let lines = fs.readFileSync('src/combat.js', 'utf8').split('\n');

lines.forEach((line, i) => {
    if (line.includes('await new Promise(r => setTimeout(r, 75));')) {
        console.log(`Line ${i+1}: ${line.trim()}`);
    }
});
