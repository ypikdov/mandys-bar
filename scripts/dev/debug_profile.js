import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log('Navigating to profile...');
  await page.goto('http://localhost:5173/perfil', { waitUntil: 'networkidle0' });
  
  // Try to login if redirected to home
  const url = page.url();
  if (url === 'http://localhost:5173/') {
    console.log('Redirected to Home, logging in...');
    await page.evaluate(() => {
      // Simulate login for testing
      localStorage.setItem('mandys_auth_token', 'test-token');
      localStorage.setItem('mandys_auth_user', JSON.stringify({
        id: "test", nombre: "Gerald Test", correo: "test@test.com", role: "ADMIN"
      }));
    });
    console.log('Navigating to profile again...');
    await page.goto('http://localhost:5173/perfil', { waitUntil: 'networkidle0' });
  }

  console.log('Final URL:', page.url());
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
  console.log('Root HTML length:', rootHtml.length);
  if (rootHtml.length < 500) {
    console.log('Root HTML snippet:', rootHtml.substring(0, 500));
  }
  
  await browser.close();
})();
