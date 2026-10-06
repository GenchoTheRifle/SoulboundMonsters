const fs = require('fs');
const PNG = require('pngjs').PNG;
const file = process.argv[2] || 'public/Art/Cave_Road_red_dots.png';

fs.createReadStream(file)
  .pipe(new PNG({
    filterType: 4
  }))
  .on('parsed', function() {
    let dots = [];
    for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
            let idx = (this.width * y + x) << 2;
            let r = this.data[idx];
            let g = this.data[idx+1];
            let b = this.data[idx+2];
            let a = this.data[idx+3];
            
            // Check for red
            if (r > 200 && g < 50 && b < 50 && a > 200) {
                let found = false;
                for (let d of dots) {
                    if (Math.abs(d.x - x) < 50 && Math.abs(d.y - y) < 50) {
                        d.x = (d.x * d.count + x) / (d.count + 1);
                        d.y = (d.y * d.count + y) / (d.count + 1);
                        d.count++;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    dots.push({x: x, y: y, count: 1});
                }
            }
        }
    }
    dots.sort((a,b) => a.x - b.x);
    console.log(dots.map(d => ({x: d.x/this.width, y: d.y/this.height})));
  });
