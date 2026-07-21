import { chromium } from 'playwright-core';
const BASE = 'http://localhost:5173';
const EXE = '/home/kushan/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/signin`, { waitUntil: 'networkidle' });
await page.fill('input[name="email"]', 'pefet94782@besteya.com');
await page.fill('input[name="password"]', 'kushan123');
await page.click('button[type="submit"]');
await page.waitForTimeout(1500);
// directly test the browser fetch the component does
const r = await page.evaluate(async () => {
  const res = await fetch('http://127.0.0.1:8082/req/courses/21', { headers: { 'Content-Type': 'application/json' } });
  const txt = await res.text();
  return { status: res.status, bodyStart: txt.slice(0, 120), ct: res.headers.get('content-type') };
});
console.log('DIRECT browser fetch to backend:', JSON.stringify(r));
// also via proxy-less courseApi default check
const r2 = await page.evaluate(() => {
  return { courseApi: (window.__courseApi) || 'n/a' };
});
console.log(r2);
await browser.close();
