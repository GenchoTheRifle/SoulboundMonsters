const fs = require('fs');

const js = fs.readFileSync('src/main.js', 'utf8');

const sections = [
    { name: 'data', marker: '// --- DATA ---' },
    { name: 'state', marker: '// --- STATE ---' },
    { name: 'core', marker: '// --- CORE LOGIC ---' },
    { name: 'collection', marker: '// --- COLLECTION ---' },
    { name: 'selection', marker: '// --- RUN SELECTION ---' },
    { name: 'map', marker: '// --- RUN ENGINE ---' },
    { name: 'combat', marker: '// --- COMBAT ENGINE ---' },
    { name: 'merge', marker: '// --- MERGE ENGINE ---' },
    { name: 'pause', marker: '// --- PAUSE & ABANDON ---' }
];

const indices = sections.map(s => ({ ...s, index: js.indexOf(s.marker) }));

for (let i = 0; i < indices.length; i++) {
    const start = indices[i].index;
    const end = i < indices.length - 1 ? indices[i+1].index : js.length;
    const content = js.substring(start, end).trim();
    fs.writeFileSync(`src/${indices[i].name}.js`, content);
}

const html = fs.readFileSync('index.html', 'utf8');
const newHtml = html.replace('<script src="/src/main.js"></script>', 
    sections.map(s => `<script src="/src/${s.name}.js"></script>`).join('\n    ')
);
fs.writeFileSync('index.html', newHtml);

console.log('JS Split complete');
