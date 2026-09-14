const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.log('Page error:', err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Console error:', msg.text());
  });
  
  await page.goto('http://localhost:3000');
  
  // Click the chatbot button
  console.log("Clicking button...");
  await page.waitForSelector('button.fixed.bottom-6.right-6');
  await page.click('button.fixed.bottom-6.right-6');
  
  await new Promise(r => setTimeout(r, 2000));
  console.log("Done");
  await browser.close();
})();
