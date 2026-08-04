const fs = require('fs');
let code = fs.readFileSync('src/styles.css', 'utf8');

code = code.replace(/\.turn-order \{\s*display: flex;\s*gap: 10px;\s*background: rgba\(0,0,0,0\.5\);\s*padding: 10px 20px;\s*border-radius: 20px;\s*\}/, `.turn-order {
            display: flex;
            gap: 10px;
            background: rgba(0,0,0,0.5);
            padding: 10px 20px;
            border-radius: 20px;
            position: relative;
        }`);

fs.writeFileSync('src/styles.css', code);
