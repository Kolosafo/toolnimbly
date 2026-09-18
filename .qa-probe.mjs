import { chromium } from '@playwright/test';
const slug = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://127.0.0.1:3200/tools/'+slug);
await page.waitForLoadState('networkidle');
const info = await page.evaluate(() => {
  const ctrls = Array.from(document.querySelectorAll('input,select,textarea,button')).map(el => {
    const lab = el.labels && el.labels[0] ? el.labels[0].textContent.trim() : '';
    return {tag: el.tagName, type: el.type, id: el.id, name: el.name, label: lab, aria: el.getAttribute('aria-label'), value: el.value, opts: el.tagName==='SELECT'? Array.from(el.options).map(o=>o.value+'|'+o.textContent.trim()) : undefined, text: el.tagName==='BUTTON'? el.textContent.trim():undefined};
  });
  return ctrls;
});
console.log(JSON.stringify(info,null,1));
const main = await page.evaluate(()=>{const m=document.querySelector('main'); return m?m.innerText.slice(0,3000):''});
console.log('=====MAIN=====');
console.log(main);
await browser.close();
