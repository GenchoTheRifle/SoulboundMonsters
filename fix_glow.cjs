const fs = require('fs');
let css = fs.readFileSync('src/styles.css', 'utf8');

const target = `.turn-icon {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            background: rgba(0, 0, 0, 0.6);
        }

        .turn-icon.ally {
            box-shadow: 0 0 10px rgba(81, 207, 102, 0.8);
        }

        .turn-icon.enemy {
            box-shadow: 0 0 10px rgba(255, 107, 107, 0.8);
        }

        .turn-icon.active.ally {
            box-shadow: 0 0 15px gold, 0 0 10px rgba(81, 207, 102, 0.8);
        }

        .turn-icon.active.enemy {
            box-shadow: 0 0 15px gold, 0 0 10px rgba(255, 107, 107, 0.8);
        }

        .turn-icon.active {
            transform: scale(1.2);
            z-index: 5;
        }`;

const replacement = `.turn-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            background: transparent;
        }

        .turn-icon.ally {
            filter: drop-shadow(0 0 5px rgba(81, 207, 102, 1));
        }

        .turn-icon.enemy {
            filter: drop-shadow(0 0 5px rgba(255, 107, 107, 1));
        }

        .turn-icon.active.ally {
            filter: drop-shadow(0 0 10px gold) drop-shadow(0 0 5px rgba(81, 207, 102, 1));
        }

        .turn-icon.active.enemy {
            filter: drop-shadow(0 0 10px gold) drop-shadow(0 0 5px rgba(255, 107, 107, 1));
        }

        .turn-icon.active {
            transform: scale(1.2);
            z-index: 5;
        }`;

css = css.replace(target, replacement);

// Removing the background: rgba(0,0,0,0.6) from .combat-controls
css = css.replace('background: rgba(0, 0, 0, 0.6);\\n            display: flex;\\n            padding: 20px;\\n            box-sizing: border-box;\\n            gap: 20px;\\n            z-index: 10;', 'background: transparent;\\n            display: flex;\\n            padding: 20px;\\n            box-sizing: border-box;\\n            gap: 20px;\\n            z-index: 10;');

fs.writeFileSync('src/styles.css', css);
