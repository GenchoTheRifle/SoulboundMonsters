const fs = require('fs');
let code = fs.readFileSync('src/styles.css', 'utf8');

code = code.replace(
    /\.select-slot \{[^}]+\}/,
    `.select-slot {
            position: relative;
            width: 280px;
            min-height: 250px;
            border: 2px dashed #888;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.2);
            transition: all 0.2s;
            margin-bottom: 15px;
        }`
);
fs.writeFileSync('src/styles.css', code);
console.log("Patched select-slot");
