const fs = require('fs');
let css = fs.readFileSync('src/styles.css', 'utf8');

const target = ".timeline-hover::before {";
const replacement = `@keyframes bounceHover {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(5px); }
}

.timeline-hover::before {`;

css = css.replace(target, replacement);
css = css.replace('animation: bounce 1s infinite;', 'animation: bounceHover 1s infinite;');

// wait, I also have .timeline-arrow which has `animation: bounce 1s infinite;`.
// The replacement `animation: bounceHover 1s infinite;` above might replace the first match!
// Let's do it safely.
fs.writeFileSync('src/styles.css', css);
