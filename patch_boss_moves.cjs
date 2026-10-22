const fs = require('fs');

let data = JSON.parse(fs.readFileSync('public/data.json', 'utf8'));

// Mega Bat
data.BOSSES.mega_bat.moves = [
    {
        "n": "Crimson Echo",
        "c": 1,
        "t": "Beast",
        "p": 1.2,
        "ranged": true
    },
    {
        "n": "Crimson Lifesteal",
        "c": 2,
        "t": "Beast",
        "p": 1.5,
        "melee": true,
        "effect": {
            "type": "lifesteal_dmg",
            "value": 1.0,
            "target": "self"
        }
    },
    {
        "n": "Hemorrhage",
        "c": 3,
        "t": "Beast",
        "p": 1,
        "melee": true,
        "effect": {
            "type": "bleed",
            "value": 0.25,
            "turns": 3,
            "target": "enemy"
        }
    },
    {
        "n": "Savage Stance",
        "c": 2,
        "t": "Beast",
        "p": 0,
        "effect": {
            "type": "savage_stance_pct",
            "atk_value": 0.4,
            "atk_turns": 4,
            "guard_value": 0.4,
            "guard_turns": 1,
            "target": "self"
        }
    }
];

// Colossal Treant
data.BOSSES.mega_treant.moves = [
    {
        "n": "Colossal Slam",
        "c": 1,
        "t": "Nature",
        "p": 1.2,
        "melee": true
    },
    {
        "n": "Colossal Thorns",
        "c": 1,
        "t": "Nature",
        "p": 0,
        "effect": {
            "type": "reflect",
            "value": 0.25,
            "turns": 2,
            "target": "self"
        }
    },
    {
        "n": "Root Crush",
        "c": 2,
        "t": "Nature",
        "p": 1,
        "melee": false,
        "hits": 1,
        "effect": {
            "type": "stun",
            "chance": 0.15,
            "turns": 1,
            "target": "all_enemies"
        }
    },
    {
        "n": "Heal",
        "c": 2,
        "t": "Nature",
        "p": 0,
        "effect": {
            "type": "heal_pct",
            "value": 0.15,
            "target": "self"
        }
    }
];

// Heavy Robot
data.BOSSES.mega_mech.moves = [
    {
        "n": "Heavy Punch",
        "c": 1,
        "t": "Mech",
        "p": 1.2,
        "melee": true
    },
    {
        "n": "Heavy Counter",
        "c": 2,
        "t": "Mech",
        "p": 0,
        "effect": {
            "type": "counter",
            "value": 0.5,
            "turns": 1,
            "target": "self"
        }
    },
    {
        "n": "Taunt",
        "c": 1,
        "t": "Mech",
        "p": 0,
        "effect": {
            "type": "taunt",
            "desc": "Forces attacks. If backline, Melee can still hit.",
            "turns": 1,
            "target": "self"
        }
    },
    {
        "n": "Shockwave",
        "c": 3,
        "t": "Mech",
        "p": 1.2,
        "ranged": true,
        "effect": {
            "type": "stun",
            "chance": 0.2,
            "turns": 1,
            "target": "all_enemies"
        }
    }
];

fs.writeFileSync('public/data.json', JSON.stringify(data, null, 2));
console.log("Patched boss moves!");
