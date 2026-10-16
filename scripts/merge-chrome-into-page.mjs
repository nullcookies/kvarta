/*
 * Собирает шапку и подвал в саму страницу лендинга.
 *
 * В Canvas CLI 0.26 глобальные регионы объявлены устаревшими («Global regions
 * were replaced by page templates»), поэтому regions/*.json не уезжают на сайт.
 * Для одностраничного лендинга шапка и подвал — это часть страницы, поэтому
 * складываем их элементы в pages/kvarta-landing.json: шапка первой, подвал
 * последним. Порядок ключей в JSON сохраняется, Canvas рендерит корневые
 * элементы в порядке объявления.
 *
 * Запуск: node scripts/merge-chrome-into-page.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';

const pagePath = 'canvas/pages/kvarta-landing.json';
const chrome = ['canvas/regions/header.json', 'canvas/regions/footer.json'];

const page = JSON.parse(readFileSync(pagePath, 'utf8'));
const sources = chrome.map((path) => ({
  path,
  data: JSON.parse(readFileSync(path, 'utf8')),
}));

const collisions = [];
const merged = {};

for (const { path, data } of sources) {
  for (const [id, element] of Object.entries(data.elements)) {
    if (id in page.elements || id in merged) {
      collisions.push(`${id} (${path})`);
      continue;
    }
    merged[id] = element;
  }
}

if (collisions.length > 0) {
  console.error('Конфликт id между страницей и регионами:', collisions.join(', '));
  process.exit(1);
}

const elements = {
  ...merged,
  ...page.elements,
};

// Подвал — в конец: переносим его элементы после элементов страницы.
const footer = JSON.parse(readFileSync(chrome[1], 'utf8'));
for (const [id] of Object.entries(footer.elements)) {
  const element = elements[id];
  delete elements[id];
  elements[id] = element;
}

page.elements = elements;
page.description = page.description ?? '';

writeFileSync(pagePath, `${JSON.stringify(page, null, 2)}\n`, 'utf8');

const header = JSON.parse(readFileSync(chrome[0], 'utf8'));
console.log(
  `Добавлено элементов: шапка ${Object.keys(header.elements).length}, подвал ${Object.keys(footer.elements).length}; всего в странице ${Object.keys(elements).length}.`,
);
