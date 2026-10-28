const fs = require('fs');

let mergeJs = fs.readFileSync('src/merge.js', 'utf8');
mergeJs = mergeJs.replace(
    /const elementIcon = getElementIcon\(m.type\);/g,
    ''
);
mergeJs = mergeJs.replace(
    /<img src="\$\{elementIcon\}" style="width: 24px; height: 24px; filter: drop-shadow\(0px 0px 2px #000\);" alt="\$\{m.type\}" \/>/g,
    '${getTypeIconHtml(m.type, 24)}'
);
fs.writeFileSync('src/merge.js', mergeJs);

let selectionJs = fs.readFileSync('src/selection.js', 'utf8');
selectionJs = selectionJs.replace(
    /const elementIcon = getElementIcon\(s.type\);/g,
    ''
);
selectionJs = selectionJs.replace(
    /<img src="\$\{elementIcon\}" style="width: 24px; height: 24px; filter: drop-shadow\(0px 0px 2px #000\);" alt="\$\{s.type\}" \/>/g,
    '${getTypeIconHtml(s.type, 24)}'
);
selectionJs = selectionJs.replace(
    /let elementIcon = `<img src="Art\/\$\{s.type\}\.png" style="width: 24px; height: 24px; position: absolute; top: 5px; right: 5px; filter: drop-shadow\(0px 0px 2px #000\);" alt="\$\{s.type\}" \/>`;/g,
    'let elementIcon = `<div style="position: absolute; top: 5px; right: 5px; filter: drop-shadow(0px 0px 2px #000);">${getTypeIconHtml(s.type, 24)}</div>`;'
);
fs.writeFileSync('src/selection.js', selectionJs);

console.log("Patched icons!");
