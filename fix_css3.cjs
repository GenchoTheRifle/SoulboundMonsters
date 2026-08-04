const fs = require('fs');
let css = fs.readFileSync('src/styles.css', 'utf8');

css = css.replace('.grid {\\n            display: grid;\\n            grid-template-columns: 1fr 1fr;\\n            gap: 10px;\\n            background: rgba(0,0,0,0.5);\\n        }', '.grid {\\n            display: grid;\\n            grid-template-columns: 1fr 1fr;\\n            gap: 10px;\\n        }');

css = css.replace('.confirm-btns {\\n            display: flex;\\n            gap: 10px;\\n            background: rgba(0,0,0,0.5);\\n            margin-top: 20px;\\n        }', '.confirm-btns {\\n            display: flex;\\n            gap: 10px;\\n            margin-top: 20px;\\n        }');

css = css.replace('.move-cost {\\n            font-size: 14px;\\n            background: rgba(0,0,0,0.5);\\n            \\n            padding: 4px 8px;\\n            border-radius: 10px;\\n        }', '.move-cost {\\n            font-size: 14px;\\n            padding: 4px 8px;\\n            border-radius: 10px;\\n        }');

css = css.replace('.turn-icon {\\n            width: 80px;\\n            height: 80px;\\n            border-radius: 50%;\\n            display: flex;\\n            justify-content: center;\\n            align-items: center;\\n            flex-shrink: 0;\\n            background: rgba(0, 0, 0, 0.6);\\n        }', '.turn-icon {\\n            width: 80px;\\n            height: 80px;\\n            border-radius: 50%;\\n            display: flex;\\n            justify-content: center;\\n            align-items: center;\\n            flex-shrink: 0;\\n            background: transparent;\\n        }');

fs.writeFileSync('src/styles.css', css);
