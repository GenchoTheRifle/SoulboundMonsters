const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

const regex = /const firstIcon = turnOrderEl\.children\[0\];[\s\S]*?icon\.style\.animation = 'slideLeft 0\.5s forwards';\s*\}\);/;

const newCode = `const arrow = turnOrderEl.querySelector('.timeline-arrow');
                const icons = Array.from(turnOrderEl.querySelectorAll('.turn-icon'));
                if (icons.length > 0) {
                    icons[0].style.animation = 'fadeOutLeft 0.5s forwards';
                }
                
                const slideIcons = icons.slice(1);
                slideIcons.forEach(icon => {
                    icon.style.animation = 'slideLeft 0.5s forwards';
                });`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/combat.js', code);

