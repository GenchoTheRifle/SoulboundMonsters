const fs = require('fs');

let mergeJs = fs.readFileSync('src/merge.js', 'utf8');
mergeJs = mergeJs.replace(
    /\$\{m.art.includes\('\.png'\) \? `<img src="\$\{m.art\}" draggable="false" \/>` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">\$\{m.art\}<\/div>`\}/g,
    '${renderArt(m.art, 200)}'
);
mergeJs = mergeJs.replace(
    /\$\{s.art.includes\('\.png'\) \? `<img src="\$\{s.art\}" draggable="false" \/>` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">\$\{s.art\}<\/div>`\}/g,
    '${renderArt(s.art, 200)}'
);
mergeJs = mergeJs.replace(
    /\$\{outcome.art.includes\('\.png'\) \? `<img src="\$\{outcome.art\}" draggable="false" \/>` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">\$\{outcome.art\}<\/div>`\}/g,
    '${renderArt(outcome.art, 200)}'
);
fs.writeFileSync('src/merge.js', mergeJs);

let selectionJs = fs.readFileSync('src/selection.js', 'utf8');
selectionJs = selectionJs.replace(
    /\$\{s.art.includes\('\.png'\) \? `<img src="\$\{s.art\}" draggable="false" \/>` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">\$\{s.art\}<\/div>`\}/g,
    '${renderArt(s.art, 200)}'
);
fs.writeFileSync('src/selection.js', selectionJs);

console.log("Patched art!");
