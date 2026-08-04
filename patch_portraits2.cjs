const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

const target = `                    const portraitSide = u.isBoss ? 'Boss' : (isAlly ? 'Ally' : 'Enemy');
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

const replacement = `                    const portraitSide = u.isBoss ? 'Boss' : (isAlly ? 'Ally' : 'Enemy');
                    let baseName = u.name;
                    if (baseName === "Ultimate Drone") baseName = "Ultimate Spark Bot";
                    const formattedName = baseName.replace(/[ \\-]/g, '_');
                    const img = document.createElement('img');
                    img.src = \`Art/\${formattedName}_\${portraitSide}_Portrait.png\`;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.imageRendering = 'pixelated';
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
