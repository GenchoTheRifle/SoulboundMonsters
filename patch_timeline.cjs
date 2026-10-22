const fs = require('fs');
let code = fs.readFileSync('src/combat.js', 'utf8');

// Replace calculateTurnOrder
const calculateTurnOrderRegex = /function calculateTurnOrder\(isMidCombat = false\) \{[\s\S]*?currentRun\.activeTurnIndex = 0;\s*\n\s*\}/;
const newCalculateTurnOrder = `function calculateTimeline(activeUnit = null) {
            let timeline = [];
            let all = [...currentRun.party, ...combatState.enemies].filter(u => u && u.currentHp > 0);
            
            all.forEach(u => {
                if (u.turnMeter === undefined) u.turnMeter = 0;
            });

            if (activeUnit) timeline.push(activeUnit);

            let simMeters = new Map();
            all.forEach(u => simMeters.set(u, u.turnMeter));

            let loopCount = 0;
            while(timeline.length < 15 && loopCount < 1000) {
                loopCount++;
                let readyUnits = all.filter(u => simMeters.get(u) >= 100);
                if (readyUnits.length > 0) {
                    readyUnits.sort((a, b) => simMeters.get(b) - simMeters.get(a));
                    let nextUnit = readyUnits[0];
                    timeline.push(nextUnit);
                    simMeters.set(nextUnit, simMeters.get(nextUnit) - 100);
                } else {
                    all.forEach(u => {
                        let spd = u.spd * (1 + (u.spdMod || 0));
                        if(spd < 1) spd = 1;
                        simMeters.set(u, simMeters.get(u) + spd);
                    });
                }
            }
            currentRun.timeline = timeline;
        }

        function pullNextUnit() {
            let all = [...currentRun.party, ...combatState.enemies].filter(u => u && u.currentHp > 0);
            if (all.length === 0) return null;
            let loopCount = 0;
            while(loopCount < 1000) {
                loopCount++;
                let readyUnits = all.filter(u => (u.turnMeter || 0) >= 100);
                if (readyUnits.length > 0) {
                    readyUnits.sort((a, b) => (b.turnMeter || 0) - (a.turnMeter || 0));
                    let unit = readyUnits[0];
                    unit.turnMeter -= 100;
                    return unit;
                } else {
                    all.forEach(u => {
                        let spd = u.spd * (1 + (u.spdMod || 0));
                        if(spd < 1) spd = 1;
                        u.turnMeter = (u.turnMeter || 0) + spd;
                    });
                }
            }
            return null;
        }

        function calculateTurnOrder(isMidCombat = false) {
            if (!isMidCombat) {
                const all = [...currentRun.party, ...combatState.enemies].filter(u => u && u.currentHp > 0);
                all.forEach(u => u.turnMeter = 0);
            }
            calculateTimeline(combatState.activeUnit);
        }`;

code = code.replace(calculateTurnOrderRegex, newCalculateTurnOrder);

fs.writeFileSync('src/combat.js', code);
