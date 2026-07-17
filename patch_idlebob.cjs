const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');

content = content.replace(/\.combatant:not\(\.dead\) \.art-content\s*\{[\s\S]*?\}/, 
`.combatant:not(.dead) .art-content {
    animation: idleBob 2s ease-in-out infinite;
    transform-origin: bottom center;
}
.select-slot .art-content {
    animation: none !important;
}`);

fs.writeFileSync('src/styles.css', content);
