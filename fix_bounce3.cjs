const fs = require('fs');
let css = fs.readFileSync('src/styles.css', 'utf8');

css = css.replace('animation: bounceHover 1s infinite;', 'animation: bounce 1s infinite;');

// now both have bounce 1s infinite
// let's change the one in timeline-hover::before
const idx = css.lastIndexOf('animation: bounce 1s infinite;');
if (idx !== -1) {
    css = css.substring(0, idx) + 'animation: bounceHover 1s infinite;' + css.substring(idx + 'animation: bounce 1s infinite;'.length);
}

fs.writeFileSync('src/styles.css', css);
