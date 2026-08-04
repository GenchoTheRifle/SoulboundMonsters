const fs = require('fs');
let css = fs.readFileSync('src/styles.css', 'utf8');

css = css.replace('border: none;\\n            border-radius: 8px;\\n            background: transparent;', 'border: 1px solid #5a6067;\\n            border-radius: 8px;\\n            background: #74787d;');

css = css.replace('.combat-log {\\n            width: 250px;\\n            height: 120px;\\n            margin-left: 120px;\\n            margin-bottom: 10px;\\n            background: transparent;\\n            border: none;\\n            border-radius: 8px;', '.combat-log {\\n            width: 250px;\\n            height: 120px;\\n            margin-left: 120px;\\n            margin-bottom: 10px;\\n            background: #74787d;\\n            border: 1px solid #5a6067;\\n            border-radius: 8px;');

fs.writeFileSync('src/styles.css', css);
