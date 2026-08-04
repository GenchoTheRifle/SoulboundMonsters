const fs = require('fs');
let data = JSON.parse(fs.readFileSync('public/data.json', 'utf8'));

function fixArtPath(art) {
    if(!art) return art;
    let name = art.replace('Art/', '');
    let ui_files = ["Bat_Ally_Portrait.png", "Bat_Enemy_Portrait.png", "Bear_Ally_Portrait.png", "Bear_Enemy_Portrait.png", "Drone_Ally_Portrait.png", "Drone_Enemy_Portrait.png", "Mushroom_Ally_Portrait.png", "Mushroom_Enemy_Portrait.png", "Robot_Ally_Portrait.png", "Robot_Enemy_Portrait.png", "Sentry_Ally_Portrait.png", "Sentry_Enemy_Portrait.png", "Slime_Ally_Portrait.png", "Slime_Enemy_Portrait.png", "Treant_Ally_Portrait.png", "Treant_Enemy_Portrait.png", "Wolf_Ally_Portrait.png", "Wolf_Enemy_Portrait.png", "Arrow.png", "BeastMech.png", "Beast.png", "Buff DMG.png", "Buff Energy.png", "Cave Map.png", "Collection Button.png", "Combat UI.png", "Counter.png", "Debuff DMG.png", "Element Counter Advanced.png", "Element Counter Button.png", "EN.png", "Forest Map.png", "Guard.png", "HP.png", "Icon.png", "Laboratory Map.png", "Main Menu.png", "MechNature.png", "Mech.png", "NatureBeast.png", "Nature.png", "Poison.png", "Regen.png", "Select Act_1.png", "Select Act_2.png", "Select Act_3.png", "Select Act.png", "Select Starters.png", "Settings.png", "Sleep.png", "Start Run Button0.png", "Start Run Button.png", "Start Run.png", "Stun.png", "Taunt.png", "Thorns.png", "Title.png", "Toxin.png", "Lifesteal.png"];
    
    if (ui_files.includes(name)) {
        return "Art/UI/" + name;
    } else {
        return "Art/Monsters/" + name;
    }
}

function processObj(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
        for (let item of obj) processObj(item);
    } else {
        if (obj.art) obj.art = fixArtPath(obj.art);
        for (let key in obj) {
            processObj(obj[key]);
        }
    }
}

processObj(data);
fs.writeFileSync('public/data.json', JSON.stringify(data, null, 2));
