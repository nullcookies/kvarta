/*
 * Диагностика конкретного элемента на живой странице: классы и вычисленные
 * стили. Запуск: node scripts/dev/inspect-element.mjs <css-селектор>
 */

import { chromium } from 'playwright';

const selector = process.argv[2] ?? 'h1';
const url = process.argv[3] ?? 'https://kvarta.ddev.site/';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ ignoreHTTPSErrors: true });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

const info = await page.evaluate((sel) => {
  const nodes = [...document.querySelectorAll(sel)];
  return nodes.slice(0, 4).map((node) => {
    const style = getComputedStyle(node);
    return {
      tag: node.tagName,
      className: node.className,
      text: (node.textContent ?? '').trim().slice(0, 60),
      color: style.color,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      textTransform: style.textTransform,
    };
  });
}, selector);

console.log(JSON.stringify(info, null, 2));
await browser.close();
