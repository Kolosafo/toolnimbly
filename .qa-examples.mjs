import { chromium } from '@playwright/test';
const slugs = ['percentage-calculator','loan-calculator','mortgage-calculator','compound-interest-calculator','salary-calculator','age-calculator','date-difference-calculator','bmi-calculator','calorie-calculator'];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const s of slugs) {
  await page.goto('http://127.0.0.1:3200/tools/'+s);
  await page.waitForLoadState('networkidle');
  const txt = await page.evaluate(() => {
    const out = [];
    const heads = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
    for (const h of heads) {
      if (/worked example/i.test(h.textContent||'')) {
        let sec = h.closest('section') || h.parentElement;
        out.push(sec.innerText);
      }
    }
    return out.join('\n=====\n');
  });
  console.log('########## '+s+' ##########');
  console.log(txt || '(no worked example found)');
}
await browser.close();
