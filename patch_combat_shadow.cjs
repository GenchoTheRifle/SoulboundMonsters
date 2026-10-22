const fs = require('fs');

let combatJs = fs.readFileSync('src/combat.js', 'utf8');

const target = `                div.querySelector('.art-content').innerHTML = artHtml;`;
const replacement = `                div.querySelector('.art-content').innerHTML = artHtml;
                const shadowEl = div.querySelector('.shadow-ellipse');
                if (shadowEl) {
                    shadowEl.className = \`shadow-ellipse \${shadowClass}\`;
                }`;

if (combatJs.includes(target)) {
    combatJs = combatJs.replace(target, replacement);
    fs.writeFileSync('src/combat.js', combatJs);
    console.log("Patched combat shadow!");
} else {
    console.log("Target not found!");
}
