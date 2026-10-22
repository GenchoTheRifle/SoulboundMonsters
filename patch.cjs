const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

const logic = `
            let shadowClass = "shadow-small";
            const smallShadows = ["Slime", "Sentry", "Drone", "Mushroom", "Robot"];
            const mediumShadows = ["Wolf", "Bat", "Elite Sentry", "Ultimate Drone", "Iron Wolf", "Pulse Slime", "Neon Shroom", "Skyreaver Bat", "Fighter Wolf"];
            const bigShadows = ["Treant", "Bear", "Alpha Wolf", "Elder Bear", "King Slime", "Giant Mushroom", "Bearwolf", "Slimy Wolf", "Spore Wolf", "Spark Wolf", "Mossy Bear", "Fungal Bear", "Artillery Bear", "Plasma Bear", "Mycelium Ooze", "Bio-Tank", "Rooted Cannon", "Assault Mech", "Crimson Bat", "Batwolf", "Vampiric Slime", "Doom Bat", "Nocturne Bear", "Bloodcap", "Colossal Treant", "Timber Wolf", "Thorn Bear", "Blight Wood", "Deathcap Wood", "Root Cyborg", "Bark Hunter", "Forest Stalker", "Heavy Robot", "Wrestler Bear", "Grappler Slime", "Punk Mushroom", "Enforcer Robot", "Hitman Robot", "Berserker Bat", "Hybrid Titan"];
            
            if (bigShadows.includes(u.name)) {
                shadowClass = "shadow-big";
            } else if (mediumShadows.includes(u.name)) {
                shadowClass = "shadow-medium";
            }
`;

code = code.replace("if (!div.querySelector('.hp-fill') || !div.querySelector('.hp-text')) {", logic + "\n            if (!div.querySelector('.hp-fill') || !div.querySelector('.hp-text')) {");

code = code.replace('<div class="shadow-ellipse"></div>', '<div class="shadow-ellipse ${shadowClass}"></div>');

fs.writeFileSync('src/combat.js', code);
