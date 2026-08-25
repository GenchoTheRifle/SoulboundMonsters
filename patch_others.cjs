const fs = require('fs');

const files = ['src/map.js', 'src/merge.js', 'src/selection.js'];
files.forEach(f => {
    let code = fs.readFileSync(f, 'utf8');
    
    // In these files, the monster object is usually `m` or `s`. Let's use string replace with regex.
    // In map.js: m.name
    // In merge.js: m.name
    // In selection.js: s.name
    
    code = code.replace(/<div class="shadow-ellipse"><\/div>/g, (match, offset, str) => {
        // Need to figure out the variable name. We can search backwards for `m.art` or `s.art`
        const recentStr = str.substring(offset - 100, offset);
        let varName = 'm';
        if (recentStr.includes('s.art')) {
            varName = 's';
        }
        return `<div class="shadow-ellipse \${getShadowClass(${varName}.name)}"></div>`;
    });
    
    fs.writeFileSync(f, code);
});
