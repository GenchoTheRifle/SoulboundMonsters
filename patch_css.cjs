const fs = require('fs');
let code = fs.readFileSync('src/styles.css', 'utf8');

const newShadowCSS = `
        .shadow-ellipse {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            z-index: 1;
        }

        .shadow-small {
            width: 120px;
            height: 30px;
            bottom: -5px;
        }

        .shadow-medium {
            width: 160px;
            height: 40px;
            bottom: -5px;
        }

        .shadow-big {
            width: 220px;
            height: 55px;
            bottom: -5px;
        }
`;

code = code.replace(/\.shadow-ellipse \{[\s\S]*?z-index: 1;\n        \}/, newShadowCSS.trim());

fs.writeFileSync('src/styles.css', code);
