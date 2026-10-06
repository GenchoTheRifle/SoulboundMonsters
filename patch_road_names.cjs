const fs = require('fs');
let stateJs = fs.readFileSync('src/state.js', 'utf8');
stateJs = stateJs.replace(
    /return "url\\('Art\/Cave Road.png'\\)";/,
    `return "url('Art/Cave_Road_red_dots.png')";`
);
fs.writeFileSync('src/state.js', stateJs);
console.log("Patched road names!");
