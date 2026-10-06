const fs = require('fs');
let code = fs.readFileSync('src/styles.css', 'utf8');

const regex = /\.turn-icon \{[\s\S]*?\.turn-icon\.active \{[\s\S]*?\}/;

const replacement = `.turn-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            background: transparent;
        }

        .turn-icon.active {
            transform: scale(1.2);
            filter: drop-shadow(0 0 5px gold);
            z-index: 5;
        }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/styles.css', code);
