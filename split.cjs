const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
const css = html.substring(styleStart + 7, styleEnd).trim();

const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>');
const js = html.substring(scriptStart + 8, scriptEnd).trim();

const newHtml = html.substring(0, styleStart) + 
    '    <link rel="stylesheet" href="/src/styles.css">\n' + 
    html.substring(styleEnd + 8, scriptStart) + 
    '    <script src="/src/main.js"></script>\n' + 
    html.substring(scriptEnd + 9);

if (!fs.existsSync('src')) fs.mkdirSync('src');
fs.writeFileSync('src/styles.css', css);
fs.writeFileSync('src/main.js', js);
fs.writeFileSync('index.html', newHtml);

console.log('Split complete');
