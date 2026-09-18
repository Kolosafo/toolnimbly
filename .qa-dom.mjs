import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://127.0.0.1:3200/tools/percentage-calculator');
await page.waitForLoadState('networkidle');
const t = await page.evaluate(()=>{
  const inp = document.querySelector('input[type=text]');
  let n = inp; const chain=[];
  while(n && n.tagName!=='BODY'){ chain.push(n.tagName+'.'+(n.className||'').toString().slice(0,80)+' #'+n.id); n=n.parentElement; }
  return chain;
});
console.log(t.join('\n'));
console.log('=====FULL MAIN=====');
console.log(await page.evaluate(()=>document.querySelector('main').innerText));
await browser.close();
