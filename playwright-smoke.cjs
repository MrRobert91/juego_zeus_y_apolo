const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:8000/', { waitUntil: 'networkidle' });
  await page.click('#start-button');
  await page.waitForTimeout(500);
  const result = await page.evaluate(() => ({
    overlayVisible: document.getElementById('overlay').classList.contains('visible'),
    running: typeof gameState !== 'undefined' ? gameState.running : null,
    score: document.getElementById('score')?.textContent
  }));
  console.log(JSON.stringify(result));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
