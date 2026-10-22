const fs = require('fs');
let styles = fs.readFileSync('src/styles.css', 'utf8');

styles = styles.replace(
    /\.combatant\.boss \.monster-art-container > \.art-content \{[\s\S]*?\}/,
    `.combatant.boss .monster-art-container > .art-content {
    scale: 2.0;
    transform-origin: bottom center;
}`
);

styles = styles.replace(
    /\.combatant\.boss \.monster-art-container > \.shadow-ellipse \{[\s\S]*?\}/,
    `.combatant.boss .monster-art-container > .shadow-ellipse {
    transform: translateX(-50%);
    scale: 2.0;
}`
);

fs.writeFileSync('src/styles.css', styles);
console.log("Patched boss scale!");
