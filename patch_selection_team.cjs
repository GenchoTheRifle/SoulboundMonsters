const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');
if (!content.includes('.selection-team {\\n    row-gap: 80px;')) {
    content += `\n.selection-team {\n    row-gap: 80px;\n}\n`;
    fs.writeFileSync('src/styles.css', content);
}
