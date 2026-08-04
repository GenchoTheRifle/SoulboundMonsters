const fs = require('fs');
let css = fs.readFileSync('src/styles.css', 'utf8');

css = css.replace('.timeline-arrow {\\n    position: absolute;\\n    top: -20px;\\n    left: 45px;\\n    width: 0;\\n    height: 0;\\n    border-left: 10px solid transparent;\\n    border-right: 10px solid transparent;\\n    border-top: 15px solid gold;\\n    filter: drop-shadow(0px 0px 2px black);\\n    z-index: 10;\\n    animation: bounceHover 1s infinite;\\n}', `.timeline-arrow {
    position: absolute;
    top: -20px;
    left: 45px;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 15px solid gold;
    filter: drop-shadow(0px 0px 2px black);
    z-index: 10;
    animation: bounce 1s infinite;
}`);

css = css.replace('animation: bounce 1s infinite;\\n    z-index: 20;\\n    pointer-events: none;', 'animation: bounceHover 1s infinite;\\n    z-index: 20;\\n    pointer-events: none;');

fs.writeFileSync('src/styles.css', css);
