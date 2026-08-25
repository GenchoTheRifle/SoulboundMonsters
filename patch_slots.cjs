const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');

content = content.replace(/\.select-slot\.filled\s*\{[\s\S]*?\}/, `.select-slot.filled {
            border: none;
            background: transparent;
            /* Keep width and height from .select-slot */
            justify-content: flex-start;
        }`);

fs.writeFileSync('src/styles.css', content);
