const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const selectionScreenRegex = /<div id="screen-selection" class="screen"[\s\S]*?<!-- Map -->/;
const newSelectionScreen = `<div id="screen-selection" class="screen" style="position: relative; padding: 0;">
    <div id="selection-bg" class="combat-arena" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('Art/Cave Map.png') center/cover; z-index: 1;">
        <div id="selection-player-team" class="team selection-team">
            <div style="position: absolute; top: calc(100% + 120px); right: 50px; width: 280px; text-align: center; font-size: 24px; font-weight: bold; color: white; text-shadow: 2px 2px 4px #000; direction: ltr;">FRONT ROW</div>
            <div style="position: absolute; top: calc(100% + 120px); left: 50px; width: 280px; text-align: center; font-size: 24px; font-weight: bold; color: white; text-shadow: 2px 2px 4px #000; direction: ltr;">BACK ROW</div>
            <div id="slot-0" class="select-slot" data-slot="0" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
            <div id="slot-1" class="select-slot" data-slot="1" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
            <div id="slot-2" class="select-slot" data-slot="2" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
            <div id="slot-3" class="select-slot" data-slot="3" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
        </div>
        <div class="team" style="pointer-events: none;"></div>
    </div>
    
    <h2 style="position: absolute; top: 20px; left: 20px; z-index: 10; margin: 0; text-shadow: 2px 2px 4px #000;">SELECT 2 STARTERS</h2>
    <button onclick="showScreen('screen-arcs')" style="position: absolute; bottom: 20px; left: 20px; z-index: 10; width: 150px;">BACK</button>
    
    <div id="selection-drawer" style="position: absolute; top: 0; right: 0; width: 850px; height: 100%; background: rgba(0,0,0,0.85); padding: 20px; z-index: 10; display: flex; flex-direction: column; border-left: 2px solid #444; transition: transform 0.5s;">
        <h3 style="margin-top: 0; text-align: center; font-size: 30px;">Available</h3>
        <div id="selection-list" style="flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 15px; align-content: stretch; margin-bottom: 20px;" ondrop="dropList(event)" ondragover="allowDrop(event)"></div>
        <button id="btn-start-run" disabled onclick="startRun()" style="width: 100%; padding: 25px; font-size: 24px;">ENTER MAP</button>
    </div>
</div>

<!-- Map -->`;
html = html.replace(selectionScreenRegex, newSelectionScreen);
fs.writeFileSync('index.html', html);
console.log("Rewrote selection screen back to normal");
