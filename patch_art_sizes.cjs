const fs = require('fs');

let mergeJs = fs.readFileSync('src/merge.js', 'utf8');
mergeJs = mergeJs.replace(
    /\$\{renderArt\(m\.art, 200\)\}/g,
    '${m.art.includes(".png") ? `<img src="${m.art}" draggable="false" />` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${m.art}</div>`}'
);
mergeJs = mergeJs.replace(
    /\$\{renderArt\(s\.art, 200\)\}/g,
    '${s.art.includes(".png") ? `<img src="${s.art}" draggable="false" />` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${s.art}</div>`}'
);
mergeJs = mergeJs.replace(
    /\$\{renderArt\(outcome\.art, 200\)\}/g,
    '${outcome.art.includes(".png") ? `<img src="${outcome.art}" draggable="false" />` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${outcome.art}</div>`}'
);
fs.writeFileSync('src/merge.js', mergeJs);

let selectionJs = fs.readFileSync('src/selection.js', 'utf8');
selectionJs = selectionJs.replace(
    /\$\{renderArt\(s\.art, 200\)\}/g,
    '${s.art.includes(".png") ? `<img src="${s.art}" draggable="false" />` : `<div style="font-size:100px; position:relative; z-index:2; line-height:1;">${s.art}</div>`}'
);
fs.writeFileSync('src/selection.js', selectionJs);

console.log("Patched art sizes!");
