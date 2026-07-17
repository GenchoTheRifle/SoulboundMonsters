const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const startIdx = html.indexOf('<div id="screen-merge" class="screen">');
const endIdx = html.indexOf('<!-- Modals -->');

if (startIdx !== -1 && endIdx !== -1) {
    const newMergeScreen = `        <div id="screen-merge" class="screen" style="position: relative; padding: 0;">
            <div id="merge-arena-bg" class="combat-arena" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('Art/Background.png') center/cover; z-index: 1;">
                <div id="merge-player-team" class="team selection-team">
                    <div id="merge-party-slot-0" class="select-slot" data-slot="0" ondrop="dropMergeParty(event)" ondragover="allowDrop(event)"></div>
                    <div id="merge-party-slot-1" class="select-slot" data-slot="1" ondrop="dropMergeParty(event)" ondragover="allowDrop(event)"></div>
                    <div id="merge-party-slot-2" class="select-slot" data-slot="2" ondrop="dropMergeParty(event)" ondragover="allowDrop(event)"></div>
                    <div id="merge-party-slot-3" class="select-slot" data-slot="3" ondrop="dropMergeParty(event)" ondragover="allowDrop(event)"></div>
                </div>
                <div class="team" style="pointer-events: none;"></div>
            </div>
            <h2 style="position: absolute; top: 20px; left: 20px; z-index: 10; margin: 0; text-shadow: 2px 2px 4px #000;">THE LAB MERGE</h2>
            <!-- Right: Merge Slots -->
            <div id="merge-drawer" style="position: absolute; top: 0; right: 0; width: 850px; height: 100%; background: rgba(0,0,0,0.85); padding: 20px; z-index: 10; display: flex; flex-direction: column; border-left: 2px solid #444; align-items: center;">
                <h3 style="margin-top: 0; text-align: center; font-size: 30px;">Merge Slots</h3>
                <div style="display: flex; justify-content: center; gap: 20px; margin: 40px 0;" ondrop="dropMergeList(event)" ondragover="allowDrop(event)">
                    <div id="merge-slot-0" class="merge-slot" data-slot="0" ondrop="dropMergeSlot(event)" ondragover="allowDrop(event)">+</div>
                    <div id="merge-slot-1" class="merge-slot" data-slot="1" ondrop="dropMergeSlot(event)" ondragover="allowDrop(event)">+</div>
                </div>
                <div id="merge-outcome" style="min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <!-- Outcome will be rendered here -->
                </div>
                <div style="margin-top: auto; width: 100%; display: flex; flex-direction: column; gap: 10px;">
                    <button id="btn-do-merge" disabled onclick="executeMerge()" style="width: 100%; padding: 25px; font-size: 24px;">MERGE</button>
                    <button onclick="finishMerge()" style="width: 100%; padding: 25px; font-size: 24px;">DONE / SKIP</button>
                </div>
            </div>
        </div>
        `;
    
    html = html.substring(0, startIdx) + newMergeScreen + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log("Successfully replaced merge screen");
} else {
    console.log("Could not find start or end index");
}
