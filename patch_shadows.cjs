const fs = require('fs');
let code = fs.readFileSync('src/styles.css', 'utf8');

code = code.replace(/\.shadow-medium \{\s*width: 160px;\s*height: 40px;\s*bottom: -5px;\s*\}/, `.shadow-medium {
            width: 160px;
            height: 40px;
            bottom: -10px;
        }`);

code = code.replace(/\.shadow-big \{\s*width: 220px;\s*height: 55px;\s*bottom: -5px;\s*\}/, `.shadow-big {
            width: 220px;
            height: 55px;
            bottom: -15px;
        }`);

fs.writeFileSync('src/styles.css', code);
