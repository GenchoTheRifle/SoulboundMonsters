const fs = require('fs');
let styles = fs.readFileSync('src/styles.css', 'utf8');

styles += `
.art-content {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
}
`;

fs.writeFileSync('src/styles.css', styles);
console.log("Patched art-content CSS!");
