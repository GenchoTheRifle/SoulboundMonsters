const fs = require('fs');
let css = fs.readFileSync('src/styles.css', 'utf8');

css = css.replace('.energy-display {\\n            font-size: 24px;\\n            background: transparent;\\n            border: 1px solid #5a6067;\\n            padding: 10px;\\n            border-radius: 8px;\\n            text-align: center;\\n            color: #00a8ff;\\n            font-weight: bold;\\n            text-shadow: 1px 1px 2px #000;\\n        }', '.energy-display {\\n            font-size: 24px;\\n            background: #74787dcc;\\n            border: 1px solid #5a6067;\\n            padding: 10px;\\n            border-radius: 8px;\\n            text-align: center;\\n            color: #00a8ff;\\n            font-weight: bold;\\n            text-shadow: 1px 1px 2px #000;\\n        }');

fs.writeFileSync('src/styles.css', css);
