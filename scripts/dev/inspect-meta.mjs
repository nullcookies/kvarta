/*
 * Печатает метатеги страницы: OG, Twitter, canonical.
 * Запуск: node scripts/dev/inspect-meta.mjs [url]
 */

const url = process.argv[2] ?? 'https://kvarta.ddev.site/';
const response = await fetch(url);
const html = await response.text();

const pattern = /<(?:meta|link)\b[^>]*(?:og:|twitter:|canonical)[^>]*>/gi;
const tags = [...html.matchAll(pattern)].map((match) => match[0].replace(/\s+/g, ' ').trim());

console.log(tags.join('\n'));
if (tags.length === 0) {
  console.log('Метатегов OG/Twitter/canonical не найдено.');
}
