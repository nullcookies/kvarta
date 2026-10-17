# Кварта — лендинг обжарки кофе на Drupal CMS + Canvas

Тестовое задание «Лендинг обжарки» (<https://tz.vitai.world/>) выполнено на
**Drupal CMS 2.2.5 (Drupal 11.4.10) + Canvas**: страница собрана из React-компонентов
Canvas (Code Components), дизайн взят не из Figma, а из темы-шаблона
**The Coffee Shop** (WordPress block theme), сконвертированной в Drupal-тему
конвертером **WordPal**. Всё запускается локально на **DDEV**.

## Как запустить

```shell
git clone <репозиторий> kvarta && cd kvarta
ddev start                     # поднимает Drupal CMS, ставит зависимости
ddev drush site:install /var/www/html/recipes/drupal_cms_starter --site-name="Кварта" \
  --account-name=admin --account-pass=admin -y
ddev composer drupal:recipe-unpack
ddev drush en wordpal_canvas wordpal_convert kvarta_lead -y
ddev drush wordpal:convert the-coffee-shop --target=canvas \
  --mapping=/var/www/html/mapping.yml --replace --no-demo-content -y
ddev drush config:set system.theme default the_coffee_shop -y
cd canvas && npm install && npx canvas push --include-pages --yes
```

Сайт: <https://kvarta.ddev.site> · админка `/user/login` — `admin` / `admin`.

## Стек

| Слой | Что используется |
| --- | --- |
| CMS | Drupal CMS 2.2.5 на Drupal 11.4.10, PHP 8.4, MariaDB 11.8 |
| Конструктор страниц | Canvas 1.12.0 (Code Components: React 19 + Tailwind 4 + CVA) |
| Дизайн | тема `the_coffee_shop` (WordPal 1.0.0-alpha8 конвертировал WP-тему The Coffee Shop 1.1) |
| Компоненты лендинга | 20 компонентов в `canvas/src/components` |
| Форма заявок | модуль `kvarta_lead`, эндпоинт `POST /api/lead` |
| Локальная среда | DDEV 1.25.2 + Docker Desktop, Node.js 24 |
| Инструменты ИИ | скиллы `drupal_devkit` → маркетплейс `drupal-canvas-plugin`, скиллы стартера Canvas |

## Структура

```
canvas/                        Code Components: React, Tailwind, CLI Canvas
  src/components/              20 компонентов (section, hero, product-card, lead-form, …)
  pages/kvarta-landing.json    спецификация лендинга (49 элементов)
  regions/                     шапка и подвал (в CLI 0.26 регионы устарели — см. ниже)
web/modules/custom/kvarta_lead/ бэкенд заявок
web/modules/custom/kvarta_seo/  SEO: JSON-LD, sitemap.xml, preload, lang=ru
web/themes/custom/the_coffee_shop/ тема, сгенерированная WordPal
recipes/                       рецепты Drupal CMS + wordpal
docs/                          план, контент, декомпозиция Canvas, лог работы с ИИ, Lighthouse
```

## Форма заявки

`POST /api/lead`, JSON на входе и выходе. Поля: `name`, `phone`, `interest`
(`subscription` | `order` | `question`), `comment` + атрибуция (`utm_*`,
`click_id`/`click_id_type`, `referrer`, `landing_page`, `page_url`) и honeypot
`website`. Ответы: `201` — заявка создана, `200` c `duplicate: true` — повтор в
пределах 10 минут, `422` — ошибки по полям, `429` — flood control, `500` —
внутренняя ошибка.

Что закрыто из требований ТЗ:

- **белорусский телефон**: номер нормализуется к `+375XXXXXXXXX` (принимаем
  `+375…`, `375…`, `80…`, `0…` и просто 9 цифр), проверяется код оператора или
  области, ошибка объясняется словами: «В номере должно быть 9 цифр после кода
  +375. Пример: +375 (29) 123-45-67»;
- **дедупликация 10 минут**: нормализованный номер + окно 600 секунд, поверх —
  блокировка (`lock`) и уникальный индекс `phone_hash + slot`, поэтому двойное
  нажатие и параллельные запросы не создают вторую заявку;
- **атрибуция**: фронтенд хранит first touch в `sessionStorage` (utm, gclid/yclid/
  fbclid, referrer, страница входа) и добавляет страницу отправки; бэкенд пишет
  IP только в виде хеша с солью сайта;
- **ошибки видны человеку**: клиентская валидация с подсказками под полем,
  серверные ошибки — в тот же блок с `aria-live`, при сетевой или серверной
  ошибке показывается телефон для звонка;
- **дублирование в Telegram** (плюс из ТЗ): включается переменными окружения
  `KVARTA_TELEGRAM_TOKEN` и `KVARTA_TELEGRAM_CHAT_ID`, без них тихо пропускается.

**Где хранятся заявки и почему.** В таблице `kvarta_lead` основной БД Drupal, а
не в файле или SQLite. Сайт и так работает на MariaDB в DDEV и на боевом
хостинге: не нужно второе хранилище и вторая копия резервных копий, а
транзакции и уникальный индекс — это ровно те инструменты, которыми закрывается
требование «повтор не создаёт вторую заявку» (с файлом пришлось бы городить
свою блокировку). Заявки видны менеджеру в админке: `/admin/content/kvarta-leads`,
там же сводка по источникам; выгрузка — обычными средствами Drupal.

## SEO, доступность и Core Web Vitals

Модуль `kvarta_seo` закрывает техническую часть поисковой оптимизации, а
доступность и `robots.txt`/`sitemap` настроены на уровне темы и конфигурации:

- **`lang="ru"`** на `<html>` (`hook_preprocess_html`): контент Canvas хранится с
  langcode=en, но сайт целиком русский;
- **JSON-LD** (`LocalBusiness` + хлебные крошки) для локальной выдачи;
- **`robots`-мета**, `og:locale` (`ru_RU`), `canonical`, OG/Twitter-превью;
- **`sitemap.xml`** (маршрут в модуле) и строка `Sitemap:` в `robots.txt`
  (модуль `robotstxt`, конфиг вместо физического файла);
- **preload** hero-картинки (`fetchpriority="high"`) и двух шрифтов,
  `font-display: fallback` во всех `@font-face`;
- **`<main id="main-content">`** в теме — для `landmark-one-main`.

Итог Lighthouse mobile: **Accessibility 100 · Best practices 100 · SEO 100**;
Performance низкий (49) из-за клиентского рендера Canvas — разбор в
[docs/LIGHTHOUSE.md](docs/LIGHTHOUSE.md). План работ — [docs/SEO-PLAN.md](docs/SEO-PLAN.md).

## Чеклист сдачи (раздел 05 ТЗ)

| # | Пункт | Где |
| --- | --- | --- |
| 1 | Ссылка на сайт | <https://kvarta.ddev.site> (локальный DDEV, см. «Ограничения») |
| 2 | Репозиторий с пошаговыми коммитами | `git log --oneline` — коммиты по шагам, а не один в конце |
| 3 | Лог работы с ИИ | [docs/AI-LOG.md](docs/AI-LOG.md) |
| 4 | Lighthouse для мобильной версии | [docs/LIGHTHOUSE.md](docs/LIGHTHOUSE.md) + отчёты в `docs/lighthouse/` |
| 5 | README | этот файл |

## Что сделано руками, а что ИИ

**ИИ (агенты) делал:** всю рутину вокруг Drupal и Canvas — установку и настройку
окружения, код компонентов и формы, тексты, конвертацию темы, прогоны проверок,
черновики документации.

**Человек решал:** архитектуру (Drupal CMS + Canvas вместо Next.js, шаблон
The Coffee Shop вместо Figma), хранение заявок, структуру лендинга и контент,
изменение контракта компонента `section` (`verticalPadding` вместо `paddingY`),
отказ от публичного хостинга в пользу локального DDEV, приёмку каждого шага.

**Где ИИ ошибался** (подробности — в [docs/AI-LOG.md](docs/AI-LOG.md)):

- принял блокировку Docker песочницей за неработающий Docker Desktop;
- убил процесс-обёртку `ddev start` и запустил вторую установку Composer
  параллельно с первой — две установки начали портить `vendor/`;
- сделал проп `section.paddingY` с подписью «Vertical Padding» — валидатор Canvas
  требует `verticalPadding` (id = camelCase подписи);
- сначала сопоставил в маппинге WordPal `post` и `page` одному типу материала,
  из-за чего конвертер дважды пытался забрать один и тот же шаблон и падал.

Каждую из этих ошибок поймали проверкой (HTTP-код, `ps`, `canvas validate`,
лог конвертера), а не «на глаз».

## Ограничения и что сделал бы иначе

- **Публичного хостинга нет**: по требованию заказчика проект поднимается на
  DDEV, ссылка локальная. Для боевого варианта: любой хостинг с PHP 8.4 и
  MariaDB, `composer install --no-dev`, экспорт конфигурации и `drush config:import`.
- **Performance на мобильном низкий (49) из-за Canvas**: компоненты отдаются
  островами `client="only"`, без серверного рендера, поэтому первый экран
  появляется только после загрузки JS. Подробный разбор и план — в
  [docs/LIGHTHOUSE.md](docs/LIGHTHOUSE.md). Accessibility 100, Best practices 100,
  SEO 100.
- **WordPal сконвертировал тему, но не все выводы конвертации**: маппинг по
  умолчанию рассчитан на тип материала `blog`, которого в Drupal CMS starter нет,
  поэтому шаблоны материалов, Views и демо-контент не применились — тему взяли,
  а страницу собрали свою. Страница WordPal «Home» (`/home`) осталась как пример
  того, что успел сгенерировать конвертер.
- **Шапка и подвал лежат в самой странице**, а не в регионах: в Canvas CLI 0.26
  глобальные регионы объявлены устаревшими и не публикуются. Для многостраничного
  сайта их надо переносить в page templates.
- **Telegram включён по переменным окружения**, боевого бота нет — умышленно,
  чтобы не хранить чужие токены.
- **Анимации**: сделаны только мягкие появления секций; при желании добавил бы
  больше движения, но Lighthouse на мобильном важнее.

## Технические заметки (грабли, на которые мы наступили)

- **Патч Canvas CLI для Windows.** В `@drupal-canvas/cli` 0.26.x функция
  `isBareImport()` считает «голым» импортом любой путь, который не начинается с
  точки или слэша, — то есть и `E:\проект\...`, и `src/components/…`. Из-за
  этого сборка падала на каждом компоненте: «Entry module … cannot be external».
  Патч лежит в [canvas/scripts/patch-canvas-cli.mjs](canvas/scripts/patch-canvas-cli.mjs)
  и накатывается автоматически через `postinstall`; когда CLI починят, скрипт
  тихо ничего не сделает.
- **CSS темы не в слоях.** WordPress-тема приходит со «сырым» CSS, а он по
  спецификации сильнее слоёв Tailwind — поэтому цвет заголовков, ссылок и
  абзацев из темы перебивал Utility-классы (h1 на тёмном фото оставался тёмным,
  карамельная кнопка теряла контраст). В `canvas/src/global.css` есть
  приоритетный блок, возвращающий управление Utility-цветам.
- **Страница создаётся черновиком.** В спецификации Canvas-страницы нет поля
  `status`, поэтому CLI публикует страницы неопубликованными; публикуем их
  скриптом [scripts/dev/publish-canvas-pages.php](scripts/dev/publish-canvas-pages.php).
- **Алиас `/` ломает ядро.** Если создать Canvas-страницу с алиасом `/`, ядро
  Drupal 11.4 падает в `menu_link_content` (`updatePathAlias()` получает `null`).
  Поэтому страница живёт на `/kvarta`, а главной назначена через
  `system.site.page.front`.
- **Push на DDEV бывает неполным.** `canvas push` изредка обрывается на шаге
  подготовки страницы («No response from …»): контейнер не успевает отвечать.
  Компоненты и ассеты при этом уже выгружены — помогает повторный запуск.

## Полезные команды

```shell
ddev drush php:script scripts/dev/canvas-info.php        # тема, страницы, регионы, заявки
ddev drush php:script scripts/dev/lead-stats.php         # последние заявки и атрибуция
ddev drush php:script scripts/dev/publish-canvas-pages.php
ddev exec "cd /var/www/html && node scripts/test-lead-api.mjs"   # 16 сценариев формы
ddev exec "cd /var/www/html && node scripts/dev/seo-audit.mjs"  # SEO-аудит отрендеренной страницы
cd canvas && node scripts/verify-landing.mjs             # браузер: рендер, вёрстка, форма
```
