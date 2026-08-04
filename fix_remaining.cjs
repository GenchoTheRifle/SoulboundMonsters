const fs = require('fs');

function replaceAll(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    code = code.split("'Art/Title.png'").join("'Art/UI/Title.png'");
    code = code.split('"Art/HP.png"').join('"Art/UI/HP.png"');
    code = code.split('"Art/EN.png"').join('"Art/UI/EN.png"');
    code = code.split("\`Art/\${v.prefix}_\${i + 1}.png\`").join("\`Art/VFX/\${v.prefix}_\${i + 1}.png\`");
    code = code.split("\`Art/\${s.type}.png\`").join("\`Art/UI/\${s.type}.png\`");
    code = code.split("\`Art/Bite_\${frame}.png\`").join("\`Art/VFX/Bite_\${frame}.png\`");
    code = code.split("\`Art/RootCrush_\${frame}.png\`").join("\`Art/VFX/RootCrush_\${frame}.png\`");
    code = code.split("\`Art/Echo_\${i}.png\`").join("\`Art/VFX/Echo_\${i}.png\`");
    code = code.split("\`Art/Hemorrhage_\${i}.png\`").join("\`Art/VFX/Hemorrhage_\${i}.png\`");
    fs.writeFileSync(file, code);
}

replaceAll('src/map.js');
replaceAll('src/core.js');
replaceAll('src/selection.js');
replaceAll('src/combat.js');
