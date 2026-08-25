const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');
content += '\n.select-slot.combatant .art-content { animation: idleBob 2s ease-in-out infinite !important; }\n';
fs.writeFileSync('src/styles.css', content);
