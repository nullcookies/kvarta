/*
 * SEO-аудит отрендеренной страницы: что реально видят краулеры и как размечена
 * страница. Запуск: ddev exec "cd /var/www/html && node scripts/dev/seo-audit.mjs [url]"
 */

const url = process.argv[2] ?? 'https://kvarta.ddev.site/';
const html = await (await fetch(url)).text();

const count = (re) => (html.match(re) ?? []).length;
const attr = (re) => (html.match(re) ?? []).map((m) => m[0]);

console.log('=== <head> ===');
console.log('lang            :', (html.match(/<html[^>]*lang="([^"]+)"/) ?? [])[1] ?? '—');
console.log('dir             :', (html.match(/<html[^>]*dir="([^"]+)"/) ?? [])[1] ?? '—');
console.log('viewport        :', attr(/<meta[^>]*name="viewport"[^>]*>/i)[0] ?? '—');
console.log('robots meta     :', attr(/<meta[^>]*name="robots"[^>]*>/i)[0] ?? '—');
console.log('canonical       :', attr(/<link[^>]*rel="canonical"[^>]*>/i)[0] ?? '—');
console.log('og:locale       :', attr(/<meta[^>]*og:locale[^>]*>/i)[0] ?? '—');
console.log('theme-color     :', attr(/<meta[^>]*name="theme-color"[^>]*>/i)[0] ?? '—');
console.log('preload         :', count(/rel="preload"/g));
console.log('modulepreload   :', count(/rel="modulepreload"/g));
console.log('json-ld блоков  :', count(/application\/ld\+json/g));

console.log('\n=== структура ===');
console.log('<h1>            :', count(/<h1[\s>]/g));
console.log('<h2>            :', count(/<h2[\s>]/g));
console.log('<h3>            :', count(/<h3[\s>]/g));
console.log('<main>          :', count(/<main[\s>]/g));
console.log('<nav>           :', count(/<nav[\s>]/g));
console.log('<ul>/<ol>       :', count(/<ul[\s>]|<ol[\s>]/g));
console.log('<img>           :', count(/<img[\s>]/g));
console.log('<img> с alt     :', count(/<img[^>]*alt="/g));
console.log('<img> с width   :', count(/<img[^>]*width="/g));
console.log('loading=lazy    :', count(/loading="lazy"/g));

console.log('\n=== контент без JS ===');
for (const needle of ['Обжариваем в четверг', 'Иргачеффе', 'Оставьте заявку', 'canvas-island', 'api/lead']) {
  console.log(needle.padEnd(22), html.includes(needle));
}
console.log('размер HTML     :', html.length, 'байт');

// Первые 400 символов <body>, чтобы видеть, что именно отдаётся краулеру.
const body = html.match(/<body[\s\S]{0,400}/);
console.log('\n=== начало <body> ===');
console.log(body ? body[0] : '—');
