const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

const target = `                    const startersWithPortraits = ['Wolf', 'Slime', 'Sentry', 'Bear', 'Mushroom', 'Drone', 'Bat', 'Treant', 'Robot'];
                    if (startersWithPortraits.includes(u.name)) {
                        const portraitSide = isAlly ? 'Ally' : 'Enemy';
                        div.innerHTML = \`<img src="Art/\${u.name}_\${portraitSide}_Portrait.png" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" draggable="false" />\`;
                    } else {
                        div.innerHTML = renderArt(u.art, 50);
                    }`;

const replacement = `                    const portraitSide = u.isBoss ? 'Boss' : (isAlly ? 'Ally' : 'Enemy');
                    const formattedName = u.name.replace(/ /g, '_');
                    const img = document.createElement('img');
                    img.src = \`Art/\${formattedName}_\${portraitSide}_Portrait.png\`;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '50%';
                    img.draggable = false;
                    img.onerror = () => {
                        div.innerHTML = renderArt(u.art, 50);
                    };
                    div.appendChild(img);`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/combat.js', code);
    console.log("Patched successfully!");
} else {
    console.log("Target not found!");
}
