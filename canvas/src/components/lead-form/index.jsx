import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { cva } from 'class-variance-authority';
import { cn, FormattedText } from 'drupal-canvas';

/** Адрес приёма заявок, если Canvas не передал свой. */
const DEFAULT_ENDPOINT = '/api/lead';

/** Ключ first-touch атрибуции в sessionStorage. */
const ATTRIBUTION_KEY = 'kvarta:lead:attribution';

/** UTM-метки, которые забираем из query-строки. */
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];

/** Рекламные click id: ключ в query → тип, который понимает бэкенд. */
const CLICK_IDS = [
  ['gclid', 'gclid'],
  ['yclid', 'yclid'],
  ['fbclid', 'fbclid'],
];

/** Коды операторов и областей Беларуси — то, что идёт после +375. */
const BY_CODES = ['25', '29', '33', '44', '17', '15', '16', '21', '22', '23'];

/** Поля, ошибки по которым показываем под самим полем. */
const FIELD_NAMES = ['name', 'phone', 'interest', 'comment'];

/** Значения select совпадают с enum бэкенда: subscription|order|question. */
const INTEREST_OPTIONS = [
  { value: 'subscription', label: 'Подписка' },
  { value: 'order', label: 'Разовый заказ' },
  { value: 'question', label: 'Вопрос' },
];

/** Подсказка-пример под телефоном. */
const PHONE_HINT = 'Например: +375 (29) 123-45-67';

/** Тексты ошибок телефона — по образцу ответов бэкенда. */
const PHONE_ERRORS = {
  required: 'Укажите номер телефона — без него мы не сможем перезвонить.',
  digits:
    'В номере должно быть 9 цифр после кода +375. Пример: +375 (29) 123-45-67.',
  country: 'Мы работаем только с белорусскими номерами: +375 (29) 123-45-67.',
  operator:
    'Такого кода оператора в Беларуси нет. Проверьте номер: +375 (29) 123-45-67.',
};

const fieldVariants = cva(
  'w-full border bg-primary-50 px-4 py-3 text-base text-ink placeholder:text-muted focus:border-brand-dark focus:outline-2 focus:outline-offset-0 focus:outline-brand-dark',
  {
    variants: {
      invalid: {
        // Невалидное поле красим целиком в danger: рамка и фокус-обводка.
        true: 'border-danger focus:border-danger focus:outline-danger',
        false: 'border-primary-300',
      },
    },
    defaultVariants: {
      invalid: false,
    },
  },
);

const labelClass = 'font-heading text-xs tracking-wider text-ink uppercase';
const hintClass = 'text-sm text-body';
const errorClass = 'text-sm font-semibold text-danger';
const fallbackLinkClass =
  'font-semibold text-danger-dark underline underline-offset-4';

const statusVariants = cva('mt-6 border px-4 py-3 text-sm', {
  variants: {
    phase: {
      idle: 'border-primary-200 bg-primary-50 text-body',
      sending: 'border-primary-200 bg-primary-50 text-body',
      // Плашка ошибки: мягкий кирпичный фон, тёмный кирпичный текст —
      // читается и на белом, и на бежевом фоне секции.
      invalid: 'border-danger bg-danger-soft font-semibold text-danger-dark',
      success: 'border-brand-dark bg-primary-100 font-semibold text-ink',
      error: 'border-danger bg-danger-soft text-danger-dark',
    },
  },
  defaultVariants: {
    phase: 'idle',
  },
});

/** Только цифры: +375 (29) 123-45-67 → 375291234567. */
const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

/** Постоянный префикс маски — код страны. Поле всегда начинается с него. */
const PHONE_PREFIX = '+375 ';

/** Разбивает национальные цифры в «(29) 123-45-67» по мере ввода. */
const formatNational = (digits) => {
  const value = digits.slice(0, 9);

  if (!value) {
    return '';
  }

  let out = `(${value.slice(0, 2)}`;

  if (value.length >= 2) {
    out += ') ';
  }
  if (value.length > 2) {
    out += value.slice(2, 5);
  }
  if (value.length > 5) {
    out += `-${value.slice(5, 7)}`;
  }
  if (value.length > 7) {
    out += `-${value.slice(7, 9)}`;
  }

  return out;
};

/**
 * Достаёт 9 национальных цифр из всего, что ввёл человек: отбрасывает код
 * страны (375) и код выхода (80/0), остальное маска расставит сама.
 */
const nationalDigits = (value) => {
  let digits = digitsOnly(value);

  // Код страны убираем всегда, а если он оказался в значении дважды (префикс
  // маски плюс вставленный номер), снимаем повторы. Национальный номер не
  // начинается на 375, поэтому лишнее вхождение — точно код страны.
  if (digits.startsWith('375')) {
    digits = digits.slice(3);
  }
  while (digits.startsWith('375') && digits.length > 9) {
    digits = digits.slice(3);
  }

  if (digits.length > 9 && digits.startsWith('80')) {
    digits = digits.slice(2);
  } else if (digits.length > 9 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 9);
};

/** Полное значение поля по национальным цифрам. Без цифр — поле пустое. */
const formatPhone = (digits) =>
  digits ? `${PHONE_PREFIX}${formatNational(digits)}` : '';

/**
 * Позиция каретки сразу после n-й национальной цифры: считаем длину маски для
 * уже введённой части, поэтому курсор не прыгает в конец на каждой скобке.
 */
const caretAfterDigits = (digits, count) =>
  digits
    ? PHONE_PREFIX.length + formatNational(digits.slice(0, count)).length
    : 0;

/**
 * Приводит белорусский номер к каноническому виду +375XXXXXXXXX.
 * Принимает +375XXXXXXXXX, 375XXXXXXXXX, 80XXXXXXXXX, 0XXXXXXXXX и 9 цифр.
 * Возвращает `{ phone }` при успехе или `{ error }` с понятной подсказкой.
 */
const normalizePhone = (value) => {
  const digits = digitsOnly(value);

  // Поле с одним лишь префиксом маски (+375) считаем пустым.
  if (!digits || digits === '375') {
    return { error: PHONE_ERRORS.required };
  }

  // Всё, что короче 9 цифр, — не номер: просим ровно 9 цифр после +375.
  if (digits.length < 9) {
    return { error: PHONE_ERRORS.digits };
  }

  let local;

  if (digits.startsWith('375')) {
    if (digits.length !== 12) {
      return { error: PHONE_ERRORS.digits };
    }
    local = digits.slice(3);
  } else if (digits.length === 11 && digits.startsWith('80')) {
    local = digits.slice(2);
  } else if (digits.length === 10 && digits.startsWith('0')) {
    local = digits.slice(1);
  } else if (digits.length === 9) {
    local = digits;
  } else {
    return { error: PHONE_ERRORS.country };
  }

  if (!/^\d{9}$/.test(local)) {
    return { error: PHONE_ERRORS.digits };
  }

  if (!BY_CODES.includes(local.slice(0, 2))) {
    return { error: PHONE_ERRORS.operator };
  }

  return { phone: `+375${local}` };
};

/** Canvas отдаёт ссылки строкой или объектом `{ uri }`. */
const resolveUrl = (value) => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.uri ?? value.url ?? undefined;
};

const readStoredAttribution = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    // Приватный режим или запрет storage — соберём атрибуцию заново.
    return null;
  }
};

/**
 * First touch: метки объявления, click id, реферер и первая страница сессии.
 * Данные живут в sessionStorage, поэтому переход по странице их не теряет,
 * а повторный заход с новой рекламы не переписывает первый источник.
 */
const collectAttribution = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  const stored = readStoredAttribution();
  if (stored) {
    return stored;
  }

  const params = new URLSearchParams(window.location.search);
  const attribution = {};

  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      attribution[key] = value;
    }
  });

  const click = CLICK_IDS.find(([key]) => params.get(key));
  if (click) {
    attribution.click_id = params.get(click[0]);
    attribution.click_id_type = click[1];
  }

  if (typeof document !== 'undefined' && document.referrer) {
    attribution.referrer = document.referrer;
  }

  attribution.landing_page = window.location.href;

  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // Storage недоступен — атрибуцию всё равно отправим вместе с заявкой.
  }

  return attribution;
};

/** Оставляет только ошибки видимых полей, приводя их к строке. */
const pickFieldErrors = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const picked = {};

  FIELD_NAMES.forEach((name) => {
    const message = raw[name];
    if (!message) {
      return;
    }
    picked[name] = Array.isArray(message) ? message.join(' ') : String(message);
  });

  return picked;
};

const LeadForm = ({
  className,
  endpoint,
  errorMessage,
  heading,
  interestLabel,
  intro,
  phoneFallback,
  privacyNote,
  submitLabel,
  successMessage,
}) => {
  const uid = useId();
  const inFlight = useRef(false);
  const statusRef = useRef(null);
  const fieldRefs = useRef({});
  // Позиция каретки, которую надо восстановить после переформатирования маски.
  const pendingCaret = useRef(null);

  const [attribution] = useState(collectAttribution);
  const [values, setValues] = useState({
    name: '',
    phone: '',
    interest: 'order',
    comment: '',
    // Honeypot: человек его не видит, бот заполняет. Отправляем как есть.
    website: '',
  });
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('idle');
  const [status, setStatus] = useState('');

  const isSending = phase === 'sending';
  const fieldId = (name) => `${uid}-${name}`;
  const errorId = (name) => `${uid}-${name}-error`;
  const phoneHintId = `${uid}-phone-hint`;

  // Фокус на сообщение: после успеха и после ошибки отправки.
  useEffect(() => {
    if ((phase === 'success' || phase === 'error') && statusRef.current) {
      statusRef.current.focus();
    }
  }, [phase, status]);

  // Возвращаем каретку на прежнее место: маска добавляет скобки и дефисы,
  // из-за чего без этого курсор уезжал бы в конец строки.
  useLayoutEffect(() => {
    const node = fieldRefs.current.phone;

    if (node && pendingCaret.current !== null) {
      const position = Math.min(pendingCaret.current, node.value.length);
      node.setSelectionRange(position, position);
      pendingCaret.current = null;
    }
  }, [values.phone]);

  const registerField = (name) => (node) => {
    fieldRefs.current[name] = node;
  };

  const updateField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));

    // Ошибку поля убираем, как только человек начал его править.
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });

    if (phase === 'invalid') {
      setPhase('idle');
      setStatus('');
    }
  };

  // Меняем только значение телефона — без побочных эффектов updateField,
  // чтобы постановка/снятие префикса маски не сбрасывала ошибку валидации.
  const setPhoneValue = (value) => {
    setValues((current) => ({ ...current, phone: value }));
  };

  const handlePhoneChange = (event) => {
    const input = event.target;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const previous = values.phone;

    let digits = nationalDigits(raw);
    let caretCount = nationalDigits(raw.slice(0, caret)).length;

    // Удаление одного разделителя: строка стала короче, но цифр столько же —
    // значит, стёрли скобку/дефис, поэтому убираем и цифру слева от каретки.
    const previousDigits = nationalDigits(previous);
    if (
      raw.length < previous.length &&
      digits.length === previousDigits.length &&
      digits.length > 0
    ) {
      const removeAt = Math.max(0, caretCount - 1);
      digits =
        previousDigits.slice(0, removeAt) + previousDigits.slice(removeAt + 1);
      caretCount = removeAt;
    }

    updateField('phone', formatPhone(digits));
    pendingCaret.current = caretAfterDigits(digits, caretCount);
  };

  // Пустое поле при фокусе сразу показывает префикс, чтобы был виден +375.
  const handlePhoneFocus = () => {
    if (!values.phone) {
      setPhoneValue(PHONE_PREFIX);
      pendingCaret.current = PHONE_PREFIX.length;
    }
  };

  // Без цифр не оставляем в поле голый префикс.
  const handlePhoneBlur = () => {
    if (!nationalDigits(values.phone)) {
      setPhoneValue('');
    }
  };

  const focusFirstInvalid = (fieldErrors) => {
    const first = FIELD_NAMES.find((name) => fieldErrors[name]);
    const node = first ? fieldRefs.current[first] : null;

    if (node) {
      node.focus();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Защита от двойного нажатия: пока запрос в полёте, второй не уходит.
    if (inFlight.current) {
      return;
    }

    const phone = normalizePhone(values.phone);
    const nextErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = 'Укажите имя — так понятнее, к кому обращаться.';
    }

    if (phone.error) {
      nextErrors.phone = phone.error;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setPhase('invalid');
      setStatus('Проверьте форму — под полями есть подсказки.');
      focusFirstInvalid(nextErrors);
      return;
    }

    inFlight.current = true;
    setErrors({});
    setPhase('sending');
    setStatus('Отправляем заявку…');

    const payload = {
      name: values.name.trim(),
      phone: phone.phone,
      interest: values.interest,
      comment: values.comment.trim(),
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
      click_id: '',
      click_id_type: '',
      referrer: '',
      landing_page: '',
      website: values.website,
      // Атрибуция first touch перекрывает пустые значения выше.
      ...attribution,
      page_url: typeof window === 'undefined' ? '' : window.location.href,
    };

    try {
      const response = await fetch(resolveUrl(endpoint) || DEFAULT_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 422) {
        const fieldErrors = pickFieldErrors(data?.errors);

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          setPhase('invalid');
          setStatus(
            data?.message || 'Проверьте форму — под полями есть подсказки.',
          );
          focusFirstInvalid(fieldErrors);
          return;
        }

        setPhase('error');
        setStatus(data?.message || errorMessage);
        return;
      }

      if (!response.ok) {
        // 429 «слишком часто», 500 и прочие ответы сервера.
        setPhase('error');
        setStatus(data?.message || errorMessage);
        return;
      }

      // 201 — заявка создана. 200 с duplicate — тот же номер уже принимали
      // за последние 10 минут: показываем это как обычный успех.
      setPhase('success');
      setStatus(data?.message || successMessage);
    } catch {
      // Сеть, CORS, таймаут: показываем телефон для звонка.
      setPhase('error');
      setStatus(errorMessage);
    } finally {
      inFlight.current = false;
    }
  };

  const phoneDescribedBy = errors.phone
    ? `${phoneHintId} ${errorId('phone')}`
    : phoneHintId;

  const phoneHref = phoneFallback
    ? `tel:${String(phoneFallback).replace(/[^\d+]/g, '')}`
    : undefined;

  return (
    <form
      className={cn(
        'relative w-full border border-primary-200 bg-white p-6 md:p-10',
        className,
      )}
      noValidate
      onSubmit={handleSubmit}
    >
      <h2 className="font-heading text-3xl text-ink uppercase md:text-4xl">
        {heading}
      </h2>

      {intro && (
        <FormattedText className="mt-4 text-base/7 text-body [&_p]:my-0">
          {intro}
        </FormattedText>
      )}

      <div className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className={labelClass} htmlFor={fieldId('name')}>
            Имя
          </label>
          <input
            aria-describedby={errors.name ? errorId('name') : undefined}
            aria-invalid={errors.name ? 'true' : undefined}
            autoComplete="name"
            className={fieldVariants({ invalid: Boolean(errors.name) })}
            id={fieldId('name')}
            name="name"
            onChange={(event) => updateField('name', event.target.value)}
            ref={registerField('name')}
            required
            type="text"
            value={values.name}
          />
          {errors.name && (
            <p className={errorClass} id={errorId('name')}>
              {errors.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass} htmlFor={fieldId('phone')}>
            Телефон
          </label>
          <input
            aria-describedby={phoneDescribedBy}
            aria-invalid={errors.phone ? 'true' : undefined}
            autoComplete="tel"
            className={fieldVariants({ invalid: Boolean(errors.phone) })}
            id={fieldId('phone')}
            inputMode="tel"
            name="phone"
            onBlur={handlePhoneBlur}
            onChange={handlePhoneChange}
            onFocus={handlePhoneFocus}
            placeholder="+375 (29) 123-45-67"
            ref={registerField('phone')}
            required
            type="tel"
            value={values.phone}
          />
          <p className={hintClass} id={phoneHintId}>
            {PHONE_HINT}
          </p>
          {errors.phone && (
            <p className={errorClass} id={errorId('phone')}>
              {errors.phone}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass} htmlFor={fieldId('interest')}>
            {interestLabel || 'Что интересует'}
          </label>
          <select
            className={fieldVariants()}
            id={fieldId('interest')}
            name="interest"
            onChange={(event) => updateField('interest', event.target.value)}
            value={values.interest}
          >
            {INTEREST_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass} htmlFor={fieldId('comment')}>
            Комментарий
          </label>
          <textarea
            className={cn(fieldVariants(), 'min-h-28 resize-y')}
            id={fieldId('comment')}
            name="comment"
            onChange={(event) => updateField('comment', event.target.value)}
            ref={registerField('comment')}
            rows={3}
            value={values.comment}
          />
        </div>

        {/* Honeypot: нулевой размер и вне экрана, бэкенд ждёт его пустым. */}
        <div
          aria-hidden="true"
          className="absolute top-0 -left-[9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor={fieldId('website')}>Website</label>
          <input
            autoComplete="off"
            className="h-0 w-0 border-0 p-0"
            id={fieldId('website')}
            name="website"
            onChange={(event) => updateField('website', event.target.value)}
            tabIndex={-1}
            type="text"
            value={values.website}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <button
          className="inline-flex cursor-pointer items-center justify-center border border-transparent bg-brand px-8 py-3.5 font-heading text-sm tracking-wider text-ink uppercase transition-colors hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSending}
          type="submit"
        >
          {isSending ? 'Отправляем…' : submitLabel}
        </button>

        {privacyNote && (
          <p className="text-xs/5 text-body sm:max-w-sm">{privacyNote}</p>
        )}
      </div>

      {status && (
        <p
          aria-live="polite"
          className={statusVariants({ phase })}
          ref={statusRef}
          role="status"
          tabIndex={-1}
        >
          {status}
        </p>
      )}

      {phase === 'error' && phoneHref && (
        <p className="mt-3 text-sm text-danger-dark">
          Позвоните:{' '}
          <a className={fallbackLinkClass} href={phoneHref}>
            {phoneFallback}
          </a>
        </p>
      )}
    </form>
  );
};

export default LeadForm;
