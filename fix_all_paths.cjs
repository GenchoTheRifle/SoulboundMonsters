const fs = require('fs');

const ui_files = fs.readFileSync('ui_files.txt', 'utf8').split('\n').filter(Boolean);
const vfx_files = fs.readFileSync('vfx_files.txt', 'utf8').split('\n').filter(Boolean);

const filesToFix = ['src/core.js', 'src/merge.js', 'src/collection.js', 'src/selection.js', 'src/state.js', 'src/combat.js', 'index.html', 'src/styles.css', 'src/data.js'];

for (let file of filesToFix) {
    if (!fs.existsSync(file)) continue;
    let code = fs.readFileSync(file, 'utf8');
    
    // We match any Art/XXX.png or Art/${something}
    // To do this simply, we could just find `Art/` and replace it, but how do we know which directory?
    // Let's replace `Art/` with a placeholder, then fix it based on the name.
    
    // Instead, just loop over UI and VFX and replace `Art/FileName.png` with `Art/UI/FileName.png`
    
    for (let f of ui_files) {
        code = code.split(`Art/${f}`).join(`Art/UI/${f}`);
        code = code.split(`Art/UI/UI/${f}`).join(`Art/UI/${f}`); // just in case it was already replaced
        code = code.split(`../Art/${f}`).join(`../Art/UI/${f}`);
        code = code.split(`../Art/UI/UI/${f}`).join(`../Art/UI/${f}`);
    }
    for (let f of vfx_files) {
        code = code.split(`Art/${f}`).join(`Art/VFX/${f}`);
        code = code.split(`Art/VFX/VFX/${f}`).join(`Art/VFX/${f}`);
    }
    
    // Note: dynamic ones like `Art/${u.name}_${portraitSide}_Portrait.png`
    // UI folder has *Portrait* files. 
    code = code.split("Art/${u.name}_${portraitSide}_Portrait.png").join("Art/UI/${u.name}_${portraitSide}_Portrait.png");
    code = code.split("Art/${type}.png").join("Art/UI/${type}.png"); // elements
    code = code.split("Art/${type}_1.png").join("Art/VFX/${type}_1.png"); // combat
    code = code.split("Art/${type}_${i}.png").join("Art/VFX/${type}_${i}.png");
    code = code.split("Art/${animPrefix}_1.png").join("Art/VFX/${animPrefix}_1.png");
    code = code.split("Art/${animPrefix}_2.png").join("Art/VFX/${animPrefix}_2.png");
    
    fs.writeFileSync(file, code);
}
console.log("Done");
