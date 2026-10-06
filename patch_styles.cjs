const fs = require('fs');
let styles = fs.readFileSync('src/styles.css', 'utf8');

styles = styles.replace(
    /\.combatant\.boss \.monster-art-container \{\s*transform: scale\(2\.0\);\s*transform-origin: bottom center;\s*margin-bottom: 40px; \/\* Make room since transform doesn't affect flow \*\/\s*\}/,
    `.combatant.boss .monster-art-container > .art-content {
    transform: scale(2.0);
    transform-origin: bottom center;
}
.combatant.boss .monster-art-container > .shadow-ellipse {
    transform: translateX(-50%) scale(2.0);
}
.combatant.boss .monster-art-container {
    margin-bottom: 40px;
}`
);

styles = styles.replace(/@keyframes tauntPulseBoss \{[\s\S]*?\}\s*\.combatant\.boss \.monster-art-container \.taunt-circle \{[\s\S]*?\}\s*/, '');
styles = styles.replace(/\.combatant\.boss\.name-heavy-robot \.monster-art-container \.taunt-circle \{[\s\S]*?\}\s*/, '');

fs.writeFileSync('src/styles.css', styles);
console.log("Patched styles.css!");
