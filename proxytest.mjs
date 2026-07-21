import { chromium } from 'playwright-core';
const BASE='http://localhost:5173'; const EXE=process.env.PW_EXE;
const b=await chromium.launch({executablePath:EXE,headless:true});
const ctx=await b.newContext(); const p=await ctx.newPage();
await p.goto(`${BASE}/signin`,{waitUntil:'networkidle'});
await p.fill('input[name=email]','pefet94782@besteya.com');
await p.fill('input[name=password]','kushan123');
await p.click('button[type=submit]'); await p.waitForTimeout(1000);
// fetch course 21 json from our own API proxy? We'll call backend via our server route using fetch to /api/media?u=/req/courses/21
const info = await p.evaluate(async ()=>{
  const r = await fetch('/lecturer/courses'); const t = await r.text();
  // not json. Instead get course json via the detail server by reading window? skip.
  return 'ok';
});
// Simpler: navigate to detail, read thumbnail img src
await p.goto(`${BASE}/courses/21`,{waitUntil:'networkidle'});
await p.waitForTimeout(800);
const html = await p.content();
const m = html.match(/src="(\/api\/media[^"]*)"/g);
console.log('MEDIA SRCS IN DETAIL PAGE:', m ? m.slice(0,5) : 'NONE');
const raw = await p.evaluate(async ()=>{
  try { const r = await fetch('/api/media?u='+encodeURIComponent('/req/courses/21')); return r.status+' '+r.headers.get('content-type'); } catch(e){ return 'ERR '+e.message; }
});
console.log('DIRECT /api/media for course 21 JSON status:', raw);
await b.close();
