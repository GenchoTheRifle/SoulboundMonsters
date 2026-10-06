const fs = require('fs');

let mergeJs = fs.readFileSync('src/merge.js', 'utf8');
mergeJs = mergeJs.replace(/getTypeIconHtml\(m\.type, 24\)/g, 'getTypeIconHtml(m.type, 40)');
mergeJs = mergeJs.replace(/getTypeIconHtml\(s\.type, 24\)/g, 'getTypeIconHtml(s.type, 40)');
mergeJs = mergeJs.replace(/getTypeIconHtml\(p1\.type, 24\)/g, 'getTypeIconHtml(p1.type, 40)');
mergeJs = mergeJs.replace(/getTypeIconHtml\(p2\.type, 24\)/g, 'getTypeIconHtml(p2.type, 40)');
fs.writeFileSync('src/merge.js', mergeJs);

let selectionJs = fs.readFileSync('src/selection.js', 'utf8');
selectionJs = selectionJs.replace(/getTypeIconHtml\(s\.type, 24\)/g, 'getTypeIconHtml(s.type, 40)');
fs.writeFileSync('src/selection.js', selectionJs);

console.log("Patched icon sizes!");
