// --- DATA ---
        let ELEMENTS = {};
        let STARTERS = {};
        let MERGES = [];
        let BOSSES = {};
function getShadowClass(name) {
    const smallShadows = ["Slime", "Sentry", "Drone", "Mushroom"];
    const mediumShadows = ["Wolf", "Bat", "Elite Sentry", "Ultimate Drone", "Iron Wolf", "Pulse Slime", "Neon Shroom", "Skyreaver Bat", "Fighter Wolf", "Robot"];
    const bigShadows = ["Treant", "Bear", "Alpha Wolf", "Elder Bear", "King Slime", "Giant Mushroom", "Bearwolf", "Slimy Wolf", "Spore Wolf", "Spark Wolf", "Mossy Bear", "Fungal Bear", "Artillery Bear", "Plasma Bear", "Mycelium Ooze", "Bio-Tank", "Rooted Cannon", "Assault Mech", "Crimson Bat", "Batwolf", "Vampiric Slime", "Doom Bat", "Nocturne Bear", "Bloodcap", "Colossal Treant", "Timber Wolf", "Thorn Bear", "Blight Wood", "Deathcap Wood", "Root Cyborg", "Bark Hunter", "Forest Stalker", "Heavy Robot", "Wrestler Bear", "Grappler Slime", "Punk Mushroom", "Enforcer Robot", "Hitman Robot", "Berserker Bat", "Hybrid Titan"];
    
    if (bigShadows.includes(name)) return "shadow-big";
    if (mediumShadows.includes(name)) return "shadow-medium";
    return "shadow-small";
}
