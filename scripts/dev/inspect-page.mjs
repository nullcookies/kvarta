/*
 * Разбор отрендеренной страницы: что реально пришло в HTML.
 *
 * Запуск: node scripts/dev/inspect-page.mjs [url]
 */

import { writeFileSync } from 'node:fs';

const url = process.argv[2] ?? 'https://kvarta.ddev.site/';
const response = await fetch(url, { dispatcher: undefined }).catch(() => null);

let html;
if (response) {
  html = await response.text();
}
else {
  const { execSync } = await import('node:child_process');
  execSync(`curl.exe -s -k "${url}" -o page.html`);
  const { readFileSync } = await import('node:fs');
  html = readFileSync('page.html', 'utf8');
}

writeFileSync('page.html', html, 'utf8');
console.log('bytes:', html.length);

const counters = [
  'canvas-island',
  'canvas-',
  'application/json',
  'js.hero',
  'drupal-canvas',
  'wp-site-blocks',
  'h1',
  'Оставьте заявку',
  'Иргачеффе',
];
for (const needle of counters) {
  const count = html.split(needle).length - 1;
  console.log(needle.padEnd(20), count);
}

const scripts = [...html.matchAll(/<script[^>]*>/g)].map((m) => m[0]);
console.log('--- scripts ---');
console.log(scripts.slice(0, 15).join('\n'));

const body = html.match(/<body[\s\S]*<\/body>/);
console.log('--- body (первые 1500 символов) ---');
console.log(body ? body[0].slice(0, 1500) : 'нет body');
