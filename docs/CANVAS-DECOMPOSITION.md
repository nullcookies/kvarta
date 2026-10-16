# Декомпозиция дизайна: Canvas-компоненты лендинга «Кварта»

Документ по обязательному процессу `canvas-design-decomposition` (фазы A–G),
лежит в репозитории, чтобы решения по структуре и API компонентов были видны
заказчику и следующим разработчикам.

## Summary

- **Design source:** не Figma, а тема-шаблон: WordPress block theme
  `the-coffee-shop` 1.1 (галерея WordPal: <https://wordpal.tresbien.tech/#q=coffe>),
  конвертированная в Drupal-тему для Canvas. Токены взяты из `theme.json`
  (палитра, шрифты, шкала отступов), структура секций — из `templates/front-page.html`
  и `patterns/*.php`, текст — из ТЗ <https://tz.vitai.world/>.
- **Scope:** полная страница (лендинг) + два региона (шапка, подвал).
- **Версия / дата:** 1.0, 2026-10-16.

## Assumptions and open questions

| Вопрос | Решение | Риск |
| --- | --- | --- |
| Точные брейкпоинты темы | Tailwind по умолчанию (sm 640 / md 768 / lg 1024) | низкий |
| Пустые состояния слотов | слоты-контейнеры получают `min-h-8`, пустые секции сворачиваются | низкий |
| Максимальная длина текстов | заголовок ≤ 90 символов, описание товара ≤ 160 | низкий |
| Медиа | соотношение 4:3 в карточках, 16:9 в hero; `object-cover` | низкий |
| Hover/focus/active | кнопки: `focus-visible:ring` на карамельном токене; ссылки — подчёркивание | низкий |
| Доступность | контраст текста на `mono-1`/`cream` ≥ 4.5:1, поля формы с `<label>`, ошибки через `aria-live` | средний |
| Форма: асинхронный ответ | JSON от `POST /api/lead` (`ok`, `duplicate`, `errors`, `message`) | средний |
| Шапка/подвал: тема или Canvas-регион | регионы Canvas (`site-header`, `site-footer`), чтобы меню и контакты правились в Canvas | средний |

## Region map

| Region | Purpose | Class |
| --- | --- | --- |
| `header` | Логотип, навигация по анкорам, телефон, кнопка «Оставить заявку» | chrome / navigation |
| `hero` | Первый экран: обещание свежести, два CTA, три факта, фото обжарки | content |
| `story` | Кто мы и почему свежесть важна (Аня и Дмитрий, партии по 5 кг) | content |
| `assortment` | Ассортимент с ценами (5 позиций) | content |
| `subscription` | Акцентная полоса подписки 54 BYN/мес | content |
| `delivery` | Доставка, самовывоз, оплата (3 колонки) | content |
| `lead` | Форма заявки | content |
| `footer` | Контакты, адрес, часы, соцсети | chrome |

## Component inventory

| machineName | Responsibility | Reuse | Parent region | Источник |
| --- | --- | --- | --- | --- |
| `section` | Полоса страницы: фон, вертикальные отступы, ширина, анкор | 7 | все | examples/section (расширяем) |
| `eyebrow` | Надзаголовок-надпись карамельным цветом | 5 | hero, story, assortment, subscription, delivery | новый |
| `heading` | Заголовок h1–h6 с размером, выравниванием, цветом | 8 | все | examples/heading (расширяем) |
| `text` | Форматированный HTML-текст (FormattedText) | 6 | все | examples/text (расширяем) |
| `button` | Кнопка/ссылка с вариантами | 4 | header, hero, subscription, lead | examples/button |
| `image` | Адаптивная картинка | 4 | hero, story, assortment, subscription | examples/image |
| `hero` | Первый экран с фоновым фото, двумя CTA и слотом фактов | 1 | hero | новый (на базе examples/hero) |
| `fact-list` | Ряд фактов (значение + подпись) | 2 | hero, story | новый |
| `fact-item` | Один факт: «5 кг — размер партии» | 6 | hero, story | новый |
| `card_container` | Сетка карточек с общим заголовком/надзаголовком | 2 | assortment, delivery | examples/card_container |
| `card` | Колонка с заголовком и текстом | 3 | delivery | examples/card |
| `product-card` | Карточка кофе: название, описание, вес, цена, фото | 4 | assortment | новый |
| `two_column_text` | Двухколоночный текстовый блок (подписка, история) | 2 | story, subscription | examples/two_column_text |
| `lead-form` | Форма заявки с клиентской валидацией и состояниями | 1 | lead | новый |
| `nav-links` | Контейнер пунктов меню | 2 | header, footer | новый |
| `nav-link` | Пункт меню | 6 | header, footer | новый |
| `site-header` | Шапка: логотип, слоган, телефон, CTA, слот меню | 1 | region `header` | новый |
| `site-footer` | Подвал: бренд, адрес, часы, телефон, почта, слоты меню и соцсетей | 1 | region `footer` | новый |

`spacer` и `grid_container` берём из examples как есть — служебная раскладка.

## Component tree

```
kvarta-landing (page /)
├── regions/header.json        → site-header
│                                  └── slot navigation → nav-links → [nav-link × 4]
├── hero                        (section background=dark)
│   ├── props: eyebrow, heading, text, CTA×2, image
│   └── slot facts → fact-list → [fact-item × 3]
├── story                       (section background=base)
│   ├── heading + eyebrow
│   ├── two_column_text (Аня и Дмитрий, почему свежесть)
│   └── slot facts → fact-list → [fact-item × 3]
├── assortment                  (section background=cream)
│   └── card_container layout=33-33-33 heading="Что обжариваем на этой неделе"
│       └── slot content → [product-card × 5]
├── subscription                (section background=dark)
│   └── two_column_text + button + image
├── delivery                    (section background=base)
│   └── card_container layout=33-33-33
│       └── slot content → [card × 3]   (самовывоз / доставка / оплата)
├── lead                        (section background=cream)
│   └── lead-form
└── regions/footer.json        → site-footer
                                   ├── slot navigation → nav-links → [nav-link × 3]
                                   └── slot social → nav-links → [nav-link × 2]
```

## API sketch (per component)

### `section`

**Implementation style:** variants — фон и отступы это перечисляемые варианты темы.

| Name | Purpose | Required? | Kind |
| --- | --- | --- | --- |
| `background` | Фон полосы | да | enum `base` / `cream` / `dark` / `brand` |
| `verticalPadding` | Вертикальные отступы темы | да | enum `none` / `small` / `medium` / `large` |
| `width` | Ширина контента | да | enum `normal` (1200px) / `wide` (во всю ширину) |
| `anchor` | Анкор для меню (`#assortment`) | нет | string |

**Slots**

| Slot key | Purpose | Empty behavior |
| --- | --- | --- |
| `content` | Содержимое полосы | `min-h-8`, при пустом — полоса без внутреннего блока |

### `eyebrow`

| Name | Purpose | Required? | Kind |
| --- | --- | --- | --- |
| `text` | Надпись | да | string |
| `textColor` | Цвет | да | enum `brand` / `muted` / `light` |

Слотов нет.

### `hero`

| Name | Purpose | Required? | Kind |
| --- | --- | --- | --- |
| `eyebrow` | Надзаголовок | нет | string |
| `heading` | Заголовок h1 | да | string |
| `text` | Подзаголовок | нет | string (HTML) |
| `primaryText` / `primaryLink` | Основной CTA | да / да | string / uri-reference |
| `secondaryText` / `secondaryLink` | Второй CTA | нет | string / uri-reference |
| `image` | Фоновое фото | нет | image object |
| `overlay` | Затемнение фона | да | enum `none` / `light` / `medium` / `strong` |
| `textColor` | Цвет текста | да | enum `light` / `dark` |

**Slots**

| Slot key | Purpose | Empty behavior |
| --- | --- | --- |
| `facts` | Ряд фактов под CTA | сворачивается |

### `fact-list` / `fact-item`

**fact-list:** `columns` (enum `2`/`3`/`4`), `textColor` (enum `light`/`dark`); слот `items` (min-h-8).
**fact-item:** `value` (string, «5 кг»), `label` (string, «размер партии»); слотов нет.

### `product-card`

| Name | Purpose | Required? | Kind |
| --- | --- | --- | --- |
| `name` | Название кофе | да | string |
| `description` | Вкусовой профиль | нет | string |
| `weight` | Вес/формат | нет | string |
| `price` | Цена | да | string |
| `badge` | Метка («светлая обжарка») | нет | string |
| `image` | Фото | нет | image object |
| `link` / `linkLabel` | Ссылка «в заявку» | нет | uri-reference / string |

Слотов нет: карточка всегда одна и та же по структуре, повторения даёт сетка.

### `lead-form`

**Implementation style:** granular props + client-state — форма собирает данные и
сама валидирует телефон до отправки.

| Name | Purpose | Required? | Kind |
| --- | --- | --- | --- |
| `heading` | Заголовок формы | да | string |
| `intro` | Пояснение | нет | string (HTML) |
| `submitLabel` | Текст кнопки | да | string |
| `successMessage` | Сообщение об успехе | да | string |
| `errorMessage` | Сообщение о сетевой ошибке | да | string |
| `privacyNote` | Сноска о персональных данных | нет | string |
| `phoneFallback` | Телефон для звонка при ошибке | да | string |
| `endpoint` | Эндпоинт приёма заявок | да | uri-reference (по умолчанию `/api/lead`) |
| `interestLabel` | Подпись поля «что интересует» | нет | string |

Слотов нет: поля формы фиксированы ТЗ (имя, телефон, интерес, комментарий).

### `nav-links` / `nav-link`

**nav-links:** `alignment` (enum `left_aligned`/`center_aligned`/`right_aligned`), `textColor` (enum `dark`/`light`); слот `items`.
**nav-link:** `label` (string), `link` (uri-reference); слотов нет.

### `site-header`

`brand`, `tagline`, `phone`, `phoneLink`, `ctaText`, `ctaLink`, `sticky` (bool);
слот `navigation`.

### `site-footer`

`brand`, `address`, `hours`, `phone`, `phoneLink`, `email`, `copyright`;
слоты `navigation`, `social`.

## Granularity audit

| Component / node | Pass/Fail | Notes |
| --- | --- | --- |
| `section` | pass | раскладка не зашита в контентные компоненты |
| `hero` | pass | 8 пропов, но разные по смыслу (текст, CTA, медиа) — дальше не дробится, факты вынесены в слот |
| `fact-item` / `fact-list` | pass | повторяемый контент — родитель + слот, не массив объектов в пропах |
| `product-card` | pass | одна карточка = один компонент; повторение даёт `card_container` |
| `card` (example) | pass | переиспользован для колонок доставки, новый компонент не понадобился |
| `lead-form` | pass | форма — единый узел со своим состоянием, дробить нечего |
| `nav-link` / `nav-links` | pass | список ссылок — повторяемый контент через слот |
| `site-header` / `site-footer` | pass | регионы: собственные контейнеры с фиксированной раскладкой |
| Повторяющиеся массивы в пропах | pass | нигде не используются, везде родитель + слот |

## Next steps

- [x] `canvas-component-composability` — повторяемый контент через родитель + слот
- [x] `canvas-component-metadata` — `component.yml` по схеме (title, camelCase id, meta:enum)
- [x] `canvas-component-definition` — папка = `machineName`, `index.jsx` + `component.yml` + `mocks.json`
- [ ] `canvas-page-definition` — `pages/kvarta-landing.json` и `regions/*.json`
- [ ] `nebula-component-validation` — `npx canvas validate` перед push
- [ ] `canvas-component-push` — публикация на сайт
