/*
 * Сквозные проверки эндпоинта заявок POST /api/lead — по пунктам ТЗ.
 *
 * Запуск: node scripts/test-lead-api.mjs [базовый-URL]
 * По умолчанию https://kvarta.ddev.site
 *
 * Каждый сценарий печатает OK/ПРОВАЛ и короткое пояснение. Скрипт рассчитан
 * на живой сайт; он специально создаёт по одной-две заявки и в конце печатает,
 * сколько их стало, чтобы результат можно было сверить с админкой.
 */

const base = process.argv[2] ?? 'https://kvarta.ddev.site';
const endpoint = `${base}/api/lead`;

let passed = 0;
let failed = 0;

const results = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    results.push(`OK      ${name}`);
  }
  else {
    failed += 1;
    results.push(`ПРОВАЛ  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// Уникальный номер на каждый прогон, чтобы не ловить дедупликацию от прошлых
// тестов: 29 + 7 цифр из времени.
function uniquePhone() {
  const tail = String(Date.now()).slice(-7);
  return `+37529${tail}`;
}

async function post(body, options = {}) {
  const response = await fetch(endpoint, {
    method: options.method ?? 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    body: options.raw ?? JSON.stringify(body),
  });
  let json = null;
  try {
    json = await response.json();
  }
  catch {
    json = null;
  }
  return { status: response.status, json };
}

const attribution = {
  utm_source: 'instagram',
  utm_medium: 'cpc',
  utm_campaign: 'kvarta_freshness_oct',
  utm_content: 'ad_roastery_video',
  utm_term: 'свежая обжарка минск',
  click_id: 'yclid_test_123456',
  click_id_type: 'yclid',
  referrer: 'https://yandex.by/',
  landing_page: 'https://kvarta.ddev.site/?utm_source=instagram&utm_medium=cpc',
  page_url: 'https://kvarta.ddev.site/',
};

// 1. Валидная заявка.
const phone1 = uniquePhone();
const first = await post({
  name: 'Аня',
  phone: phone1,
  interest: 'subscription',
  comment: 'Помол под воронку',
  website: '',
  ...attribution,
});
check(
  'валидная заявка принимается (201)',
  first.status === 201 && first.json?.ok === true,
  `status=${first.status} body=${JSON.stringify(first.json)}`,
);

// 2. Повтор того же номера в пределах 10 минут — без второй заявки.
const second = await post({
  name: 'Аня',
  phone: phone1,
  interest: 'subscription',
  comment: 'Ещё раз',
  website: '',
  ...attribution,
});
check(
  'повтор того же номера не создаёт вторую заявку',
  second.status === 200 && second.json?.duplicate === true,
  `status=${second.status} body=${JSON.stringify(second.json)}`,
);
check(
  'повтор возвращает тот же lead_id',
  second.json?.lead_id === first.json?.lead_id,
  `first=${first.json?.lead_id} second=${second.json?.lead_id}`,
);

// 3. Двойное нажатие: два параллельных запроса с новым номером.
const phone2 = uniquePhone();
const payload2 = {
  name: 'Дмитрий',
  phone: phone2,
  interest: 'order',
  comment: 'Бразилия Серрадо, 2 пачки',
  website: '',
  ...attribution,
};
const [d1, d2] = await Promise.all([post(payload2), post(payload2)]);
const created = [d1, d2].filter((r) => r.status === 201).length;
const duplicated = [d1, d2].filter((r) => r.json?.duplicate === true).length;
check(
  'двойное нажатие даёт ровно одну заявку',
  created === 1 && duplicated === 1,
  `создано=${created} дублей=${duplicated} статусы=${d1.status}/${d2.status}`,
);

// 4. Неверные телефоны.
const badPhones = [
  ['12345', 'слишком короткий'],
  ['+7 (999) 123-45-67', 'российский номер'],
  ['+375 (99) 123-45-67', 'несуществующий код оператора'],
  ['', 'пустой телефон'],
];
for (const [phone, why] of badPhones) {
  const response = await post({ name: 'Тест', phone, interest: 'question', website: '' });
  const message = response.json?.errors?.phone ?? '';
  check(
    `неверный телефон отклонён (${why})`,
    response.status === 422 && message.length > 0,
    `status=${response.status} message=${message}`,
  );
}

// 5. Подсказка про формат номера.
const shortPhone = await post({ name: 'Тест', phone: '29123', interest: 'question', website: '' });
check(
  'подсказка объясняет формат номера',
  /\+375 \(29\) 123-45-67/.test(shortPhone.json?.errors?.phone ?? ''),
  `message=${shortPhone.json?.errors?.phone}`,
);

// 6. Требуемые поля.
const noName = await post({ name: '', phone: uniquePhone(), interest: 'order', website: '' });
check('пустое имя отклонено', noName.status === 422 && !!noName.json?.errors?.name, JSON.stringify(noName.json));

const noInterest = await post({ name: 'Тест', phone: uniquePhone(), interest: '', website: '' });
check(
  'неизвестный интерес отклонён',
  noInterest.status === 422 && !!noInterest.json?.errors?.interest,
  JSON.stringify(noInterest.json),
);

// 7. Honeypot: заявка не создаётся, но ответ успешный.
const honeypot = await post({
  name: 'Бот',
  phone: uniquePhone(),
  interest: 'order',
  website: 'http://spam.example',
});
check('honeypot отбивает бота без создания заявки', honeypot.status === 200 && honeypot.json?.ok === true, JSON.stringify(honeypot.json));

// 8. Атрибуция: заявка с utm сохраняется и не путается с предыдущими.
const phone3 = uniquePhone();
const attributed = await post({
  name: 'Клиент из рекламы',
  phone: phone3,
  interest: 'order',
  comment: 'Пришёл из объявления',
  website: '',
  ...attribution,
});
check('заявка с атрибуцией принята', attributed.status === 201, `status=${attributed.status}`);

// 9. Метод не POST.
const getResponse = await fetch(endpoint, { method: 'GET' });
check('GET на эндпоинт не принимается', [404, 405].includes(getResponse.status), `status=${getResponse.status}`);

// 10. Ошибки понятны человеку: у 422 есть message.
check('у ошибки валидации есть понятное сообщение', typeof noName.json?.message === 'string' && noName.json.message.length > 0, JSON.stringify(noName.json));

// 11. Flood control: серия заявок с одного адреса.
const floodStatuses = [];
for (let i = 0; i < 12; i += 1) {
  const response = await post({ name: 'Флуд', phone: uniquePhone(), interest: 'question', website: '' });
  floodStatuses.push(response.status);
}
check(
  'flood control включается на серии заявок',
  floodStatuses.includes(429),
  `статусы=${floodStatuses.join(',')}`,
);

console.log(results.join('\n'));
console.log(`\nПройдено: ${passed}, провалено: ${failed}`);
console.log('Телефоны тестовых заявок:', [phone1, phone2, phone3].join(', '));
process.exit(failed === 0 ? 0 : 1);
