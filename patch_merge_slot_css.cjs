const fs = require('fs');
let code = fs.readFileSync('src/styles.css', 'utf8');

code = code.replace(
    /\.merge-slot \{[^}]+\}/,
    `.merge-slot {
            width: 280px;
            height: 250px;
            border: 2px dashed #444;
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #222;
        }`
);
fs.writeFileSync('src/styles.css', code);
console.log("Patched merge-slot css");
