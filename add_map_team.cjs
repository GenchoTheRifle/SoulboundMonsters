const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const modalMapTeam = `
        <!-- Map Team Modal -->
        <div id="modal-map-team" class="modal">
            <div class="modal-content" style="max-width: 600px; padding: 25px;">
                <h3 style="margin-top:0">TEAM FORMATION</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; text-align: center;">
                    <div><strong style="font-size: 20px;">BACK ROW</strong><br/><br/>
                        <div id="map-party-slot-0" class="select-slot" data-slot="0" ondrop="dropMapParty(event)" ondragover="allowDrop(event)"></div><br/>
                        <div id="map-party-slot-2" class="select-slot" data-slot="2" ondrop="dropMapParty(event)" ondragover="allowDrop(event)"></div>
                    </div>
                    <div><strong style="font-size: 20px;">FRONT ROW</strong><br/><br/>
                        <div id="map-party-slot-1" class="select-slot" data-slot="1" ondrop="dropMapParty(event)" ondragover="allowDrop(event)"></div><br/>
                        <div id="map-party-slot-3" class="select-slot" data-slot="3" ondrop="dropMapParty(event)" ondragover="allowDrop(event)"></div>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-map-team').style.display='none'" style="width:100%">CLOSE</button>
            </div>
        </div>
`;

html = html.replace('<!-- Modals -->', '<!-- Modals -->' + modalMapTeam);
fs.writeFileSync('index.html', html);

let mapJs = fs.readFileSync('src/map.js', 'utf8');
const mapFunctions = `
        window.updateMapPartyUI = function() {
            for (let i = 0; i < 4; i++) {
                const slot = document.getElementById('map-party-slot-' + i);
                if (!slot) continue;
                const m = currentRun.party[i];
                if (m) {
                    slot.innerHTML = \`
                        <div draggable="true" ondragstart="dragStartMap(event, \${i})" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:grab;">
                            <div style="width:140px; height:140px; margin-bottom:5px; pointer-events:none;">
                                \${renderArt(m.art, 120)}
                            </div>
                            <strong style="font-size:18px; text-align:center; pointer-events:none;">\${m.name}</strong>
                        </div>
                    \`;
                    slot.classList.add('filled');
                } else {
                    slot.innerHTML = '';
                    slot.classList.remove('filled');
                }
            }
        };

        window.openMapTeamModal = function() {
            updateMapPartyUI();
            document.getElementById('modal-map-team').style.display = 'flex';
        };

        window.dragStartMap = function(ev, index) {
            ev.dataTransfer.setData("index", index);
        };

        window.dropMapParty = function(ev) {
            ev.preventDefault();
            const sourceIndexStr = ev.dataTransfer.getData("index");
            if (!sourceIndexStr) return;
            const sourceIndex = parseInt(sourceIndexStr);
            
            let targetSlot = ev.target.closest('.select-slot');
            if (!targetSlot) return;
            const targetIndex = parseInt(targetSlot.getAttribute('data-slot'));

            // Swap in party
            const temp = currentRun.party[sourceIndex];
            currentRun.party[sourceIndex] = currentRun.party[targetIndex];
            currentRun.party[targetIndex] = temp;
            
            updateMapPartyUI();
        };
`;

mapJs += mapFunctions;
fs.writeFileSync('src/map.js', mapJs);
console.log("Added map team modal and logic");
