const fs = require('fs');
let content = fs.readFileSync('src/selection.js', 'utf8');

const regex = /\/\/ If it's already in a slot, don't show in list\s*if \(selectionSlots\.some\(s => s && s\.id === id\)\) return;/g;

const replacement = `// If already selected, visually disable it so it stays in place
                const isSelected = selectionSlots.some(s => s && s.id === id);`;

content = content.replace(regex, replacement);

const regex2 = /btn\.style\.cursor = 'grab';\s*btn\.style\.aspectRatio = 'auto';\s*btn\.style\.height = '100%';\s*btn\.setAttribute\('draggable', 'true'\);\s*btn\.ondragstart = \(e\) => dragStartSelection\(e, id, null\);/g;

const replacement2 = `btn.style.aspectRatio = 'auto';
                btn.style.height = '100%';
                if (isSelected) {
                    btn.style.opacity = '0.3';
                    btn.style.pointerEvents = 'none';
                    btn.style.filter = 'grayscale(1)';
                } else {
                    btn.style.cursor = 'grab';
                    btn.setAttribute('draggable', 'true');
                    btn.ondragstart = (e) => dragStartSelection(e, id, null);
                }`;

content = content.replace(regex2, replacement2);

fs.writeFileSync('src/selection.js', content);
