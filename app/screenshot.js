import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });
  // Wait a few seconds for animations to finish
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
