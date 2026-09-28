const fs=require('fs');const { chromium } = require('/Users/gyula/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
(async()=>{
const b=await chromium.launch({headless:true,executablePath:'/Users/gyula/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
const p=await (await b.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2})).newPage();
let hit=0;
await p.route(/week04-staffing\.js/, async (route)=>{const r=await route.fetch();let t=await r.text();const t0=t;
t=t.replace(/const SECTORS = \[[\s\S]*?\];/, `const SECTORS = [
  ["Finance and insurance", "#1f8fd6", (s) => s === "52"],
  ["Manufacturing", "#0f2340", (s) => s === "31-33"],
  ["Health care", "#f2820c", (s) => s === "62"],
  ["Other sectors", "#c3cfdd", (s) => s !== ""],
  ["Sector unknown", "#e3e9f1", () => true],
];`);
t=t.replace('itemStyle: { color: token(colour), borderColor: token("--surface"), borderWidth: 1.5 },','itemStyle: { color: colour, borderColor: "#ffffff", borderWidth: 1, opacity: colour === "#e3e9f1" ? 0.9 : 0.92 },\n    z: colour === "#e3e9f1" || colour === "#c3cfdd" ? 1 : 3,');
t=t.replace('symbolSize: 9,','symbolSize: (colour === "#e3e9f1" || colour === "#c3cfdd") ? 6 : 8,');
t=t.replace('id: "names",','id: "names",\n    z: 10,');t=t.replace('grid: { left: 52, right: 20, top: 36, bottom: 64 }','grid: { left: 52, right: 20, top: 36, bottom: 72 }');if(t!==t0)hit++; await route.fulfill({status:200,body:t,contentType:'application/javascript'});});
await p.goto('http://localhost:8777/weeks/week04/');await p.waitForTimeout(2000);
const url=await p.evaluate(async()=>{const d=document.querySelector('#staffing-figure');d.closest('details')&&(d.closest('details').open=true);d.scrollIntoView();await new Promise(r=>setTimeout(r,1500));
const c=echarts.getInstanceByDom(d.querySelector('.staffing-chart .chart-host'));c.resize();await new Promise(r=>setTimeout(r,800));return c.getDataURL({pixelRatio:2,backgroundColor:'#fff'});});
fs.writeFileSync('sect.png',Buffer.from(url.split(',')[1],'base64'));console.log('hit',hit);await b.close();})();
