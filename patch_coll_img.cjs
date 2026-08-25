const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf8');

content += `
.collection-square img {
    max-height: 120px;
    max-width: 100%;
    object-fit: contain;
}
.collection-square .monster-art {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    overflow: hidden;
}
`;

fs.writeFileSync('src/styles.css', content);
