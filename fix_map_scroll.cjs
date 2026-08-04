const fs = require('fs');

let js = fs.readFileSync('src/map.js', 'utf8');

js = js.replace(
    /let translateX = \(viewportWidth \/ 2\) - targetX;[\s\S]*?mapNodes\.scrollTo\(\{ left: -translateX, behavior: 'smooth' \}\);/g,
    `// Center the targetX in the viewport
                    let scrollLeft = targetX - (viewportWidth / 2);
                    
                    // Clamp it so we don't scroll past the edges
                    scrollLeft = Math.max(0, Math.min(trackWidth - viewportWidth, scrollLeft));
                    
                    mapNodes.scrollTo({ left: scrollLeft, behavior: 'smooth' });`
);

fs.writeFileSync('src/map.js', js);
console.log("Map scroll fixed!");
