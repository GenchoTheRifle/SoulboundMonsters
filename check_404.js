import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('response', response => {
        if (!response.ok()) {
            console.log(`Failed: ${response.url()} - ${response.status()}`);
        }
    });

    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
    
    // click start run button to load more assets
    try {
        await page.evaluate(() => {
            const btn = document.getElementById('screen-title');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.evaluate(() => {
            const btn = document.getElementById('menu-btn-start');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
    } catch(e) {}
    
    await browser.close();
})();
