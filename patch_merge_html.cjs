const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldMergeScreen = `        <div id="screen-merge" class="screen">
            <h2>THE LAB MERGE</h2>
            <div style="display: flex; height: calc(100% - 100px); width: 100%;">
                <!-- Left: Frontline/Backline -->
                <div style="flex: 1; position: relative; display: flex; justify-content: center; align-items: center;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10;">
                        <div style="display: grid; grid-template-columns: 200px 200px; gap: 40px; justify-content: center; margin-bottom: 10px; color: white; font-weight: bold; text-shadow: 1px 1px 2px black;">
                            <div style="text-align: center;">BACKLINE</div>
                            <div style="text-align: center;">FRONTLINE</div>
                        </div>
                        <div id="merge-bg" style="position: relative; padding: 40px; background: url('Art/Cave Map.png') center/cover; border-radius: 15px; border: 2px solid #444;">
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); border-radius: 15px;"></div>
                            <div class="team" style="position: relative; z-index: 2; width: auto; padding: 0; direction: rtl;">
                                <div id="merge-party-slot-0" class="select-slot" data-slot="0" ondrop="dropMergeParty(event)" ondragover="allowDrop(event)" style="direction: ltr;"></div>
                                <div id="merge-party-slot-1" class="select-slot" data-slot="1" ondrop="dropMergeParty(event)" ondragover="allowDrop(event)" style="direction: ltr;"></div>
                                <div id="merge-party-slot-2" class="select-slot" data-slot="2" ondrop="dropMergeParty(event)" ondragover="allowDrop(event)" style="direction: ltr;"></div>
                                <div id="merge-party-slot-3" class="select-slot" data-slot="3" ondrop="dropMergeParty(event)" ondragover="allowDrop(event)" style="direction: ltr;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Right: Merge Slots -->
                <div style="width: 500px; background: rgba(0,0,0,0.85); padding: 20px; display: flex; flex-direction: column; border-left: 2px solid #444; align-items: center; justify-content: center;">
                    <h3 style="margin-top: 0; text-align: center;">Merge Slots</h3>
                    <div style="display: flex; justify-content: center; gap: 20px; margin: 40px 0;">
                        <div id="merge-slot-0" class="merge-slot" data-slot="0" ondrop="dropMergeSlot(event)" ondragover="allowDrop(event)">+</div>
                        <div id="merge-slot-1" class="merge-slot" data-slot="1" ondrop="dropMergeSlot(event)" ondragover="allowDrop(event)">+</div>
                    </div>
                    <button id="btn-do-merge" disabled onclick="executeMerge()" style="width: 100%; padding: 15px; font-size: 18px; margin-bottom: 10px;">MERGE</button>
                    <button onclick="finishMerge()" style="width: 100%; padding: 15px; font-size: 18px;">DONE / SKIP</button>
                </div>
            </div>
        </div>`;

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
                <div style="display: flex; justify-content: center; gap: 20px; margin: 40px 0;">
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
        </div>`;

html = html.replace(oldMergeScreen, newMergeScreen);
fs.writeFileSync('index.html', html);
