# Lighthouse: мобильная версия

## Как замеряли

```shell
npx -y lighthouse https://kvarta.ddev.site/ \
  --form-factor=mobile --screenEmulation.mobile=true \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new --ignore-certificate-errors --no-sandbox --disable-gpu" \
  --output=html --output=json --output-path=docs/lighthouse/mobile --quiet
```

- Lighthouse 13.5.0, системный Google Chrome, мобильная эмуляция (412×823, DPR 1.75),
  throttling `simulate` (медленный 4G, ×4 к CPU).
- Отчёты: [mobile.report.html](lighthouse/mobile.report.html) (открывается в браузере),
  [mobile.report.json](lighthouse/mobile.report.json).
- Стенд — локальный DDEV в Docker Desktop на Windows, то есть замер идёт по
  bind-mount без продакшн-кэширования. Абсолютные цифры тут пессимистичны, но
  структурная причина медленного первого экрана от стенда не зависит (см. ниже).

## Результат (последний прогон)

| Категория | Оценка |
| --- | --- |
| Performance | **50** |
| Accessibility | **100** |
| Best practices | **100** |
| SEO | **100** |

Метрики: FCP 1,8 с · LCP 8,7 с · TBT 0 мс · CLS 0,66 · Speed Index 3,4 с.

> Метрики Performance на локальном DDEV колеблются от прогона к прогону
> (bind-mount на Windows + контейнер); ориентир — структурная причина
> (отсутствие SSR), а не единичная цифра. Остальные категории стабильны:
> Accessibility 100, Best practices 100, SEO 100.

Если в прогоне SEO выпал с `robots-txt -> robots.txt is not valid`, проверьте
`explanation` аудита: там почти всегда стоит `Timed out fetching resource`. Это
таймаут загрузки (robots.txt отдаётся модулем через бутстрап Drupal, а не
статически), а не «поломанный» файл — просто перезапустите замер.

## Что улучшили по ходу замеров

| Проблема из отчёта | Что сделали | Итог |
| --- | --- | --- |
| `color-contrast` — 4 нарушения: карамельный надзаголовок и метки на белом (~2,2:1), приглушённый текст (~3,4:1), текст на карамельной кнопке | Ввели токен `--color-accent-ink` (#7c6247) для мелкого карамельного текста на светлом, затемнили `--color-muted` до #6f6353, добавили непокрытые Utility-цвета в приоритетный блок `global.css` | `color-contrast` — **0 нарушений**, Accessibility 86 → **90** |
| `canonical` отсутствовал | Задали `canonical_url` в metatag-настройках | SEO 92 → **100** |
| Не было превью ссылки в мессенджерах | Сгенерировали OG-картинку 1200×630 шрифтом темы (GD) и прописали `og:*`/`twitter:*` | `og:title`, `og:description`, `og:image`, `twitter:card` на месте |
| `<html lang>` — контент Canvas хранится с langcode=en, но сайт целиком русский | `hook_preprocess_html` в модуле `kvarta_seo` ставит `lang="ru"` | `html-has-lang` и `html-lang-valid` проходят; Google/соцсети видят русский язык |
| `landmark-one-main` — тема WordPal не оборачивала контент в `<main>` | Обернули вывод в `<main id="main-content">` в `page.html.twig` | `landmark-one-main` — **1** (был 0) |
| `list`/`listitem` — меню рисовалось как `<ul>/<li>`, но Canvas вставляет между ними `<astro-slot>`, из-за чего структура списка невалидна | В `nav-links`/`nav-link` заменили `<ul>`/`<li>` на `<div>` (landmark `<nav>` сохранён) | `list`/`listitem` — **0 нарушений**, Accessibility 92 → **100** |
| `robots.txt` без ссылки на карту сайта | Включили модуль `robotstxt` (конфиг вместо файла) и добавили `Sitemap:` | `/robots.txt` отдаётся из конфига со строкой `Sitemap: .../sitemap.xml` |
| Нет `<meta name="robots">` и `og:locale` | Добавили в metatag-настройки (`index, follow, max-image-preview:large...`, `ru_RU`) | robots-мета и `og:locale` присутствуют |
| LCP-картинка грузилась только после гидрации острова | `heroImageUrl()` отдаёт `<link rel="preload" as="image" fetchpriority="high">` | Preload: картинка + 2 шрифта |

## Почему Performance низкий и что делать

Основная причина — **Canvas отдаёт компоненты островами с `client="only"`, без
серверного рендера**. В исходном HTML нет ни заголовка, ни карточек: браузер
получает `<canvas-island>` с JSON-пропсами, грузит JS и только потом рисует
лендинг. Отсюда и высокий LCP, и большой CLS 0,66 — контент появляется уже
после первой отрисовки. FCP после preload шрифтов и hero-картинки держится
около 1,8 с.

Что даст эффект дальше (по убыванию отдачи):

1. **Включить SSR для компонентов Canvas** — тогда разметка приходит в HTML,
   FCP/LCP падают в разы, CLS уходит. Это настройка/сборка на стороне Canvas и
   CLI, а не правка вёрстки; в этом проекте `push` собрал клиентские бандлы.
2. **Кэширование страницы**: включить dynamic page cache и Big Pipe для
   анонимных посетителей (в DDEV они и так включены, но каждый запрос идёт через
   контейнер на Windows).
3. **Продакшн-хостинг**: nginx + OPcache + агрегация CSS/JS + CDN для медиа.
   Локальный DDEV для замера производительности — заведомо худший случай.
4. **Шрифты**: у Oswald/Open Sans уже стоит `font-display: fallback`; preload
   обоих файлов добавлен модулем `kvarta_seo`.
5. **Картинки**: отдавать WebP/AVIF и правильные размеры (`image-delivery-insight`).

Общий вывод: как визуальный и функциональный результат лендинг готов, но чтобы
показывать зелёный Performance на мобильном, Canvas-страницу надо переводить на
серверный рендер — это следующий шаг, а не «докрутка» CSS.

## Доступность и SEO — итог

- **Accessibility 100**: нарушений нет. Закрыты `color-contrast`,
  `landmark-one-main` (добавлен `<main>`) и `list`/`listitem` (меню переведено на
  `<div>` — Canvas вставляет `<astro-slot>` между пунктами списка, поэтому
  семантичный `<ul>/<li>` давал невалидную структуру).
- **SEO 100**: есть `lang="ru"`, `canonical`, `robots`-мета, `og:*`/`twitter:*`,
  `sitemap.xml` и `Sitemap:` в `robots.txt`.
- **Best practices 100**.
