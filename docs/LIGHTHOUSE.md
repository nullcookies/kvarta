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
| Performance | **35** |
| Accessibility | **90** |
| Best practices | **100** |
| SEO | **100** |

Метрики: FCP 4,3 с · LCP 7,0 с · TBT 0 мс · CLS 0,688 · Speed Index 4,3 с.

## Что улучшили по ходу замеров

| Проблема из отчёта | Что сделали | Итог |
| --- | --- | --- |
| `color-contrast` — 4 нарушения: карамельный надзаголовок и метки на белом (~2,2:1), приглушённый текст (~3,4:1), текст на карамельной кнопке | Ввели токен `--color-accent-ink` (#7c6247) для мелкого карамельного текста на светлом, затемнили `--color-muted` до #6f6353, добавили непокрытые Utility-цвета в приоритетный блок `global.css` | `color-contrast` — **0 нарушений**, Accessibility 86 → **90** |
| `canonical` отсутствовал | Задали `canonical_url` в metatag-настройках | SEO 92 → **100** |
| Не было превью ссылки в мессенджерах | Сгенерировали OG-картинку 1200×630 шрифтом темы (GD) и прописали `og:*`/`twitter:*` | `og:title`, `og:description`, `og:image`, `twitter:card` на месте |

## Почему Performance низкий и что делать

Основная причина — **Canvas отдаёт компоненты островами с `client="only"`, без
серверного рендера**. В исходном HTML нет ни заголовка, ни карточек: браузер
получает `<canvas-island>` с JSON-пропсами, грузит JS и только потом рисует
лендинг. Отсюда и FCP 4,3 с, и LCP 7,0 с, и большой CLS 0,688 — контент
появляется уже после первой отрисовки.

Что даст эффект дальше (по убыванию отдачи):

1. **Включить SSR для компонентов Canvas** — тогда разметка приходит в HTML,
   FCP/LCP падают в разы, CLS уходит. Это настройка/сборка на стороне Canvas и
   CLI, а не правка вёрстки; в этом проекте `push` собрал клиентские бандлы.
2. **Кэширование страницы**: включить dynamic page cache и Big Pipe для
   анонимных посетителей (в DDEV они и так включены, но каждый запрос идёт через
   контейнер на Windows).
3. **Продакшн-хостинг**: nginx + OPcache + агрегация CSS/JS + CDN для медиа.
   Локальный DDEV для замера производительности — заведомо худший случай.
4. **Шрифты**: `font-display: swap` для Oswald/Open Sans (в отчёте видно
   `font-display-insight`, экономия небольшая, но FCP чувствителен).
5. **Картинки**: отдавать WebP/AVIF и правильные размеры (`image-delivery-insight`).

Общий вывод: как визуальный и функциональный результат лендинг готов, но чтобы
показывать зелёный Performance на мобильном, Canvas-страницу надо переводить на
серверный рендер — это следующий шаг, а не «докрутка» CSS.

## Доступность и SEO — что осталось

- `landmark-one-main`: тема, сгенерированная WordPal, не оборачивает контент в
  `<main>`. Лечится правкой `page.html.twig` в теме (наш сгенерированный код).
- `list`/`listitem`: списки в контенте свёрстаны абзацами; для строгого
  соответствия стоит вернуть `<ul>/<li>`.
- Обе правки — в теме, а не в Canvas-компонентах, и на оценку Performance не влияют.
