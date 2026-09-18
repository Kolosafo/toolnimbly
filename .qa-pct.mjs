import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
await page.goto('http://127.0.0.1:3200/tools/percentage-calculator');
await page.waitForLoadState('networkidle');
const panel = () => page.evaluate(()=>{
  const h = Array.from(document.querySelectorAll('h2,h3')).find(x=>/result/i.test(x.textContent));
  const s = h? (h.closest('section')||h.parentElement) : null;
  return (s?s.innerText:document.querySelector('main').innerText);
});
async function show(tag){ console.log('--- '+tag+' ---'); console.log(await panel()); }
await show('default 15 of 68.40');

// mode 2: X is what percent of Y, with Y=0
await page.getByRole('radio',{name:/X is what percent of Y/}).check();
await page.waitForTimeout(300);
console.log('=== mode2 controls ===');
console.log(await page.evaluate(()=>Array.from(document.querySelectorAll('input[type=text]')).map(e=>({l:e.labels[0]?.textContent.trim(),v:e.value}))));
await show('mode2 default');
const t = page.locator('input[type=text]');
await t.nth(0).fill('25'); await t.nth(1).fill('0');
await page.waitForTimeout(400);
console.log('values landed:', await t.nth(0).inputValue(), await t.nth(1).inputValue());
await show('25 is what percent of 0');

// mode3 percent change from zero
await page.getByRole('radio',{name:/Percentage change/}).check();
await page.waitForTimeout(300);
console.log('=== mode3 controls ===');
console.log(await page.evaluate(()=>Array.from(document.querySelectorAll('input[type=text]')).map(e=>({l:e.labels[0]?.textContent.trim(),v:e.value}))));
await t.nth(0).fill('0'); await t.nth(1).fill('50');
await page.waitForTimeout(400);
console.log('values landed:', await t.nth(0).inputValue(), await t.nth(1).inputValue());
await show('change from 0 to 50');
await t.nth(0).fill('68.40'); await t.nth(1).fill('78.66');
await page.waitForTimeout(400);
await show('68.40 -> 78.66 (doc claims 15% increase)');
console.log('ERRORS', errs);
await browser.close();
