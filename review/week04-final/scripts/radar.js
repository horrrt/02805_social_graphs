const fs=require('fs');const { chromium } = require('/Users/gyula/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({headless:true,executablePath:'/Users/gyula/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
const p=await (await b.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2})).newPage();
let hit=0;
await p.route(/week04-skills-radar\.js/, async (route)=>{const r=await route.fetch();let t=await r.text();const t0=t;
t=t.replace(/const shorten = \(name\) => .*;/, `const shorten = (name) => {
  if (name.length <= LABEL_CHARS) return name;
  const words = name.split(" "); let a = "";
  while (words.length && (a + " " + words[0]).trim().length <= Math.max(LABEL_CHARS, Math.ceil(name.length / 2))) a = (a + " " + words.shift()).trim();
  return a + "\\n" + words.join(" ");
};`);
t=t.replace('font: "10px -apple-system, BlinkMacSystemFont, system-ui, sans-serif", align: right ? "left" : "right", verticalAlign: "middle"','font: "10.5px -apple-system, BlinkMacSystemFont, system-ui, sans-serif", lineHeight: 12, align: right ? "left" : "right", verticalAlign: "middle"');
if(t!==t0)hit++; await route.fulfill({status:200,body:t,contentType:'application/javascript'});});
await p.goto('http://localhost:8777/weeks/week04/');await p.waitForTimeout(2000);
await p.evaluate(()=>{const sb=document.getElementById('skills-body');let d=sb.closest('details');while(d){d.open=true;d.dispatchEvent(new Event('toggle'));d=d.parentElement&&d.parentElement.closest('details');}});await p.waitForTimeout(4000);
const url=await p.evaluate(async()=>{const h=document.querySelector('.w4-radar-host');h.style.width='1008px';h.style.height='840px';h.scrollIntoView();await new Promise(r=>setTimeout(r,1200));
const c=echarts.getInstanceByDom(h);c.resize({width:1008,height:840});await new Promise(r=>setTimeout(r,900));return c.getDataURL({pixelRatio:2,backgroundColor:'#fff'});});
fs.writeFileSync('radar_new.png',Buffer.from(url.split(',')[1],'base64'));console.log('hit',hit);await b.close();})();
