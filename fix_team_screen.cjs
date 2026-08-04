const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove modal-map-team
const modalMapTeamRegex = /<div id="modal-map-team" class="modal">[\s\S]*?<\/div>\s*<\/div>/;
html = html.replace(modalMapTeamRegex, '');

// Add screen-team
const screenTeamHTML = `<!-- Team Formation -->
<div id="screen-team" class="screen" style="position: relative; padding: 0;">
    <div id="team-arena-bg" class="combat-arena" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('Art/Cave Map.png') center/cover; z-index: 1;">
        <div id="team-party" class="team selection-team">
            <div style="position: absolute; top: calc(100% + 120px); right: 50px; width: 280px; text-align: center; font-size: 24px; font-weight: bold; color: white; text-shadow: 2px 2px 4px #000; direction: ltr;">FRONT ROW</div>
            <div style="position: absolute; top: calc(100% + 120px); left: 50px; width: 280px; text-align: center; font-size: 24px; font-weight: bold; color: white; text-shadow: 2px 2px 4px #000; direction: ltr;">BACK ROW</div>
            <div id="team-party-slot-0" class="select-slot" data-slot="0" ondrop="dropTeamParty(event)" ondragover="allowDrop(event)"></div>
            <div id="team-party-slot-1" class="select-slot" data-slot="1" ondrop="dropTeamParty(event)" ondragover="allowDrop(event)"></div>
            <div id="team-party-slot-2" class="select-slot" data-slot="2" ondrop="dropTeamParty(event)" ondragover="allowDrop(event)"></div>
            <div id="team-party-slot-3" class="select-slot" data-slot="3" ondrop="dropTeamParty(event)" ondragover="allowDrop(event)"></div>
        </div>
    </div>
    
    <h2 style="position: absolute; top: 20px; left: 20px; z-index: 10; margin: 0; text-shadow: 2px 2px 4px #000;">TEAM FORMATION</h2>
    <button onclick="closeTeamScreen()" style="position: absolute; bottom: 20px; left: 20px; z-index: 10; width: 150px;">BACK</button>
    
    <div id="team-drawer" style="position: absolute; top: 0; right: 0; width: 850px; height: 100%; background: rgba(0,0,0,0.85); padding: 20px; z-index: 10; display: flex; flex-direction: column; border-left: 2px solid #444; overflow-y: auto;">
        <h3 style="margin-top: 0; text-align: center; font-size: 30px;">Team Stats</h3>
        <div id="team-stats-grid" style="flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; align-content: stretch; margin-bottom: 20px;"></div>
    </div>
</div>`;

// Insert screen-team before <!-- Combat -->
const combatScreenRegex = /<!-- Combat -->/;
html = html.replace(combatScreenRegex, `${screenTeamHTML}\n\n<!-- Combat -->`);
fs.writeFileSync('index.html', html);
console.log("Added screen-team and removed modal-map-team");
