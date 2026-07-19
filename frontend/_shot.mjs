import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: '_landing.png', fullPage: false });
console.log('TITLE:', await page.title());
console.log('URL:', page.url());
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();
