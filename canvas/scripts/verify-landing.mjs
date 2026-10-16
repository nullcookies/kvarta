/*
 * Проверка лендинга в настоящем браузере: рендер Canvas-островов, вёрстка на
 * мобильном и десктопе, работа формы заявки.
 *
 * Запуск (из каталога canvas): node scripts/verify-landing.mjs [URL]
 * Скриншоты складываются в docs/screenshots/.
 */

import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'https://kvarta.ddev.site/';
const outDir = '../docs/screenshots';
mkdirSync(outDir, { recursive: true });

// Используем установленный в системе Chrome: он же понадобится Lighthouse,
// а версия headless-оболочки Playwright может не совпадать с загруженной.
const browser = await chromium.launch({ channel: 'chrome' });
const problems = [];

async function openPage(viewport, label) {
  const context = await browser.newContext({
    viewport,
    ignoreHTTPSErrors: true,
    locale: 'ru-RU',
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  // Canvas рендерит компоненты островами, поэтому ждём именно содержимое.
  await page.waitForSelector('text=Обжариваем в четверг', { timeout: 30000 });

  const checks = {
    'шапка с брендом': await page.locator('text=КВАРТА').first().isVisible(),
    'заголовок hero': await page.locator('text=Обжариваем в четверг').first().isVisible(),
    'ассортимент с ценой': await page.locator('text=Эфиопия Иргачеффе').first().isVisible(),
    'цена позиции': await page.locator('text=32 BYN').first().isVisible(),
    'подписка': await page.locator('text=Свежая пачка у двери каждый месяц').first().isVisible(),
    'доставка': await page.locator('text=Как забрать кофе').first().isVisible(),
    'форма заявки': await page.locator('form').first().isVisible(),
    'подвал': await page.locator('text=Короля').first().isVisible(),
  };

  for (const [name, ok] of Object.entries(checks)) {
    if (!ok) {
      problems.push(`${label}: не найден блок «${name}»`);
    }
  }

  await page.screenshot({ path: `${outDir}/landing-${label}.png`, fullPage: true });

  // Полностраничный снимок мобильной версии выше лимита просмотра, поэтому
  // дополнительно сохраняем экраны по секциям — их удобно смотреть глазами.
  const sections = [
    ['bar', 'text=Обжариваем в четверг'],
    ['assortment', 'text=Эфиопия Иргачеффе'],
    ['delivery', 'text=Как забрать кофе'],
    ['lead', 'text=Оставьте заявку'],
  ];
  for (const [name, selector] of sections) {
    const anchor = page.locator(selector).first();
    if (await anchor.count()) {
      await anchor.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${outDir}/section-${label}-${name}.png` });
    }
  }

  // Проверяем, что на странице нет горизонтальной прокрутки.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 2) {
    problems.push(`${label}: горизонтальная прокрутка на ${overflow}px`);
  }

  return { context, page, consoleErrors, checks };
}

const mobile = await openPage({ width: 390, height: 844 }, 'mobile');
const desktop = await openPage({ width: 1440, height: 900 }, 'desktop');

// Отправка формы на мобильном варианте.
const page = mobile.page;
const phone = `+375 (29) ${String(Date.now()).slice(-3)}-${String(Date.now()).slice(-5, -3)}-${String(Date.now()).slice(-2)}`;

await page.fill('input[name="name"], input#name', 'Проверка из браузера');
await page.fill('input[type="tel"]', phone);
await page.selectOption('select', 'subscription');
await page.fill('textarea', 'Проверка формы на живом сайте');
await page.click('button[type="submit"]');

let formResult = 'не дождались ответа формы';
try {
  // Внимание: у text= в Playwright нет альтернации — нужен regex-синтаксис.
  await page.waitForSelector('text=/Спасибо|уже приняли|уже отправляется/', { timeout: 20000 });
  formResult = (await page.locator('[role="status"], [aria-live]').first().innerText()).trim();
}
catch {
  problems.push('mobile: форма не показала результат отправки');
}

await page.screenshot({ path: `${outDir}/landing-mobile-form.png`, fullPage: false });

// Проверка подсказки при неверном номере.
await page.fill('input[type="tel"]', '12345');
await page.click('button[type="submit"]');
await page.waitForTimeout(700);
const hint = await page.locator('text=/9 цифр|белорусскими|кода оператора/').first().isVisible().catch(() => false);
if (!hint) {
  problems.push('mobile: нет подсказки при неверном номере');
}

console.log('Результат отправки формы:', formResult);
console.log('Ошибки в консоли (mobile):', mobile.consoleErrors.length ? mobile.consoleErrors.join(' | ') : 'нет');
console.log('Ошибки в консоли (desktop):', desktop.consoleErrors.length ? desktop.consoleErrors.join(' | ') : 'нет');
console.log('Проблемы:', problems.length ? problems.join('; ') : 'нет');
console.log('Скриншоты: docs/screenshots/landing-{mobile,desktop,mobile-form}.png');

await mobile.context.close();
await desktop.context.close();
await browser.close();

process.exit(problems.length === 0 ? 0 : 1);
