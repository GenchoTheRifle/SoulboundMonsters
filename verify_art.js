import fs from 'fs';
const data = JSON.parse(fs.readFileSync('public/data.json', 'utf8'));
const files = new Set(fs.readdirSync('public/Art'));
let missing = 0;
function check(art) {
    if (!art || !art.startsWith('Art/')) return;
    const name = art.replace('Art/', '');
    if (!files.has(name)) {
        console.log('MISSING:', name);
        missing++;
    }
}
for (let key in data.STARTERS) {
    check(data.STARTERS[key].art);
    if(data.STARTERS[key].moves) data.STARTERS[key].moves.forEach(m => check(m.art));
}
for (let key in data.BOSSES) {
    check(data.BOSSES[key].art);
    if(data.BOSSES[key].moves) data.BOSSES[key].moves.forEach(m => check(m.art));
}
for (let merge of data.MERGES) {
    check(merge.art);
    if(merge.moves) merge.moves.forEach(m => check(m.art));
}
console.log('Missing count:', missing);
