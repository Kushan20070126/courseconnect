import { chromium } from 'playwright-core';
const BASE = 'http://localhost:5173';
const EXE = process.env.PW_EXE;
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const logs = [];
page.on('response', (r) => { const u=r.url(); if (u.includes('/lecturer/courses/')&&u.includes('/edit')) logs.push(`EDIT resp ${r.status()} ${u}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(`${BASE}/signin`, { waitUntil: 'networkidle' });
await page.fill('input[name="email"]', 'pefet94782@besteya.com');
await page.fill('input[name="password"]', 'kushan123');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(800);
logs.push(`after login url=${page.url()}`);

const cid = process.argv[2] || '28';
const resp = await page.goto(`${BASE}/lecturer/courses/${cid}/edit`, { waitUntil: 'networkidle' });
logs.push(`nav status=${resp.status()} final url=${page.url()}`);
await page.waitForTimeout(1200);
logs.push(`EDIT thumb img=${!!(await page.$('img[alt="thumbnail preview"]'))}`);
logs.push(`EDIT video preview=${!!(await page.$('video'))}`);
logs.push(`EDIT material view links=${(await page.$$('a.mat-view')).length}`);
logs.push(`EDIT section inputs=${(await page.$$('.sec-title')).length}`);
logs.push(`EDIT lesson inputs=${(await page.$$('.ls-title')).length}`);
console.log(logs.join('\n'));
await browser.close();
