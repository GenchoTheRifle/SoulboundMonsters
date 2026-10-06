const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const modalMapTeamStart = html.indexOf('<div id="modal-map-team" class="modal">');
const modalMapTeamEnd = html.indexOf('</div>\n        </div>\n\n        <div id="modal-notification" class="modal">') + 14;

html = html.substring(0, modalMapTeamStart) + html.substring(modalMapTeamEnd);

const screenMergeIdx = html.indexOf('<div id="screen-merge"');
const afterMergeIdx = html.indexOf('<!-- Modals -->');

const newTeamScreen = `        <div id="screen-team" class="screen" style="position: relative; padding: 0;">
            <div id="team-arena-bg" class="combat-arena" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('Art/Background.png') center/cover; z-index: 1;">
                <div id="team-player-team" class="team selection-team">
                    <div id="team-party-slot-0" class="select-slot" data-slot="0" ondrop="dropTeamParty(event)" ondragover="allowDrop(event)"></div>
                    <div id="team-party-slot-1" class="select-slot" data-slot="1" ondrop="dropTeamParty(event)" ondragover="allowDrop(event)"></div>
                    <div id="team-party-slot-2" class="select-slot" data-slot="2" ondrop="dropTeamParty(event)" ondragover="allowDrop(event)"></div>
                    <div id="team-party-slot-3" class="select-slot" data-slot="3" ondrop="dropTeamParty(event)" ondragover="allowDrop(event)"></div>
                </div>
                <div class="team" style="pointer-events: none;"></div>
            </div>
            <h2 style="position: absolute; top: 20px; left: 20px; z-index: 10; margin: 0; text-shadow: 2px 2px 4px #000;">TEAM FORMATION</h2>
            <div id="team-drawer" style="position: absolute; top: 0; right: 0; width: 850px; height: 100%; background: rgba(0,0,0,0.85); padding: 20px; z-index: 10; display: flex; flex-direction: column; border-left: 2px solid #444; align-items: center; overflow-y: auto;">
                <h3 style="margin-top: 0; text-align: center; font-size: 30px;">Party Stats</h3>
                <div id="team-stats-grid" class="collection-grid" style="width: 100%; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
                </div>
                <div style="margin-top: auto; width: 100%; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                    <button onclick="closeTeamScreen()" style="width: 100%; padding: 25px; font-size: 24px;">BACK TO MAP</button>
                </div>
            </div>
        </div>\n`;

html = html.substring(0, afterMergeIdx) + newTeamScreen + html.substring(afterMergeIdx);
fs.writeFileSync('index.html', html);
console.log("Patched team HTML");
