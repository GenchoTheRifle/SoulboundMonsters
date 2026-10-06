const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(/<div id="selection-drawer".*?>/, 
    '<div id="selection-drawer" style="position: absolute; top: 0; right: 0; width: 750px; height: 100%; background: rgba(0,0,0,0.85); padding: 20px; z-index: 10; display: flex; flex-direction: column; border-left: 2px solid #444; transition: transform 0.5s;">');

content = content.replace(/<div id="selection-list".*?>/,
    '<div id="selection-list" style="flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 15px; align-content: stretch; overflow: hidden; margin-bottom: 20px;" ondrop="dropList(event)" ondragover="allowDrop(event)">');

fs.writeFileSync('index.html', content);
