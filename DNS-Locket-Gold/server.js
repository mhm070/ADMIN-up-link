const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Locket Gold DNS automation' });
});

app.get('/automation/run', async (req, res) => {
  const password = req.query.password;
  const totalAccounts = parseInt(req.query.count, 10) || 1;
  const rawDomains = req.query.domains || '';
  const customDomains = rawDomains.split(/[\n,]+/).map((domain) => domain.trim()).filter(Boolean);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setTimeout(0);
  req.setTimeout(0);
  res.flushHeaders();

  let clientDisconnected = false;
  let browser = null;
  const markClientDisconnected = () => { clientDisconnected = true; };
  req.on('aborted', markClientDisconnected);
  res.on('close', markClientDisconnected);

  const sendEvent = (payload) => {
    if (res.writableEnded || res.destroyed) { clientDisconnected = true; return false; }
    try { res.write(`data: ${JSON.stringify(payload)}\n\n`); return true; }
    catch (error) { clientDisconnected = true; console.error('SSE write failed:', error); return false; }
  };
  const sendLog = (message) => sendEvent({ type: 'log', message });
  const heartbeat = setInterval(() => { if (!clientDisconnected) res.write(': keep-alive\n\n'); }, 10000);
  heartbeat.unref?.();

  try {
    fs.mkdirSync(path.join(__dirname, 'videos'), { recursive: true });
    sendLog('1. Launching headless browser...');
    const chromiumPath = process.env.CHROMIUM_PATH || (process.platform === 'win32'
      ? chromium.executablePath()
      : (() => { try { return execFileSync('which', ['chromium'], { encoding: 'utf8' }).trim(); } catch { return chromium.executablePath(); } })());
    browser = await chromium.launch({ headless: true, executablePath: chromiumPath, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

    for (let i = 1; i <= totalAccounts && !clientDisconnected; i += 1) {
      sendLog(`\n--- Starting Account ${i} of ${totalAccounts} ---`);
      let context = null;
      let page = null;
      try {
        context = await browser.newContext({ recordVideo: { dir: path.join(__dirname, 'videos'), size: { width: 1280, height: 720 } } });
        page = await context.newPage();
        sendLog(`[Account ${i}] Fetching temporary email...`);
        await page.goto('https://tinyhost.shop', { waitUntil: 'networkidle' });
        await page.waitForSelector('#email', { state: 'visible', timeout: 15000 });
        const cleanEmail = (await page.locator('#email').inputValue()).trim();
        sendLog(`[Account ${i}] Extracted Email: ${cleanEmail}`);
        sendLog(`[Account ${i}] Navigating to NextDNS signup...`);
        await page.goto('https://my.nextdns.io/signup', { waitUntil: 'networkidle' });
        await page.fill('input[type="email"]', cleanEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(4000);
        if (page.url().includes('signup') || page.url().includes('login')) throw new Error('Registration rejected by NextDNS!');
        sendLog(`[Account ${i}] Registration successful.`);
        sendLog(`[Account ${i}] Configuring Security tab...`);
        await page.getByRole('link', { name: 'Security' }).click();
        await page.waitForTimeout(1500);
        const securitySelector = 'input.form-check-input:checked';
        let active = await page.locator(securitySelector).count();
        while (active > 0) { await page.locator(securitySelector).first().uncheck({ force: true }); await page.waitForTimeout(500); active = await page.locator(securitySelector).count(); }
        sendLog(`[Account ${i}] Configuring Privacy tab...`);
        await page.getByRole('link', { name: 'Privacy' }).click();
        await page.waitForTimeout(1500);
        active = await page.locator(securitySelector).count();
        while (active > 0) { await page.locator(securitySelector).first().uncheck({ force: true }); await page.waitForTimeout(500); active = await page.locator(securitySelector).count(); }
        let removeCount = await page.locator('svg[data-icon="xmark"]').count();
        while (removeCount > 0) { await page.locator('svg[data-icon="xmark"]').first().click({ force: true }); await page.waitForTimeout(1000); removeCount = await page.locator('svg[data-icon="xmark"]').count(); }
        if (customDomains.length > 0) {
          await page.getByRole('link', { name: 'Denylist' }).click();
          await page.waitForTimeout(1500);
          for (const domain of customDomains) { const input = page.locator('input[placeholder="Add a domain..."]'); await input.fill(domain); await input.press('Enter'); await page.waitForTimeout(1500); }
        }
        const idMatch = page.url().match(/my\.nextdns\.io\/([a-zA-Z0-9]+)/);
        const link = idMatch ? `https://api.nextdns.io/apple/profile?profile=${idMatch[1]}` : 'Link Not Found';
        sendEvent({ type: 'account', data: { email: cleanEmail, password, link } });
      } catch (error) {
        sendLog(`[Account ${i}] Failed: ${error.message}`);
      } finally {
        if (context) { try { await context.close(); } catch (error) { sendLog(`[Account ${i}] Cleanup failed: ${error.message}`); } }
      }
      if (i < totalAccounts && !clientDisconnected) await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    if (browser) await browser.close();
    browser = null;
    if (!clientDisconnected) { sendLog('Browser process terminated.'); sendEvent({ type: 'done' }); res.end(); }
  } catch (error) {
    console.error('Automation process failed:', error);
    sendEvent({ type: 'failed', message: error.message });
    if (!res.writableEnded) res.end();
  } finally {
    if (browser) await browser.close().catch(() => {});
    req.off('aborted', markClientDisconnected);
    res.off('close', markClientDisconnected);
    clearInterval(heartbeat);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}!`));