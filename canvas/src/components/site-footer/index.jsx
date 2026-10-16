import { cn } from 'drupal-canvas';

/** Canvas отдаёт ссылки строкой или объектом `{ uri }`. */
const resolveLink = (link) => {
  if (!link) {
    return undefined;
  }

  if (typeof link === 'string') {
    return link;
  }

  return link.uri ?? link.url ?? undefined;
};

/**
 * Заголовок колонки. Базовые стили заголовков живут в `@layer base`, поэтому
 * обычная utility-окраска их перебивает и `!important` не нужен.
 */
const columnTitleClass =
  'font-heading text-xs text-primary-300 tracking-wider uppercase';
const metaClass = 'text-sm/6 text-primary-200';
const footerLinkClass =
  'text-primary-200 no-underline underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

/** Подвал региона: бренд и адрес, меню, контакты, соцсети и копирайт. */
const SiteFooter = ({
  address,
  brand,
  className,
  copyright,
  email,
  hours,
  navigation,
  phone,
  phoneLink,
  social,
}) => {
  const phoneHref = resolveLink(phoneLink);
  const emailHref = email
    ? resolveLink(email.startsWith('mailto:') ? email : `mailto:${email}`)
    : undefined;

  return (
    <footer className={cn('w-full bg-ink text-cream', className)}>
      <div className="mx-auto grid w-full max-w-content gap-10 px-4 py-14 md:grid-cols-3 md:px-8 md:py-16">
        <div className="flex flex-col gap-3">
          <p className="font-heading text-2xl leading-none tracking-[0.08em] text-white uppercase">
            {brand}
          </p>
          {address && <p className={metaClass}>{address}</p>}
          {hours && <p className={metaClass}>{hours}</p>}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className={columnTitleClass}>Меню</h2>
          <nav aria-label="Навигация в подвале">
            <div className="min-h-8">{navigation}</div>
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className={columnTitleClass}>Контакты</h2>
          <div className="flex flex-col gap-2">
            {phone &&
              (phoneHref ? (
                <a className={footerLinkClass} href={phoneHref}>
                  {phone}
                </a>
              ) : (
                <span className={metaClass}>{phone}</span>
              ))}
            {email && (
              <a className={footerLinkClass} href={emailHref}>
                {email}
              </a>
            )}
          </div>

          <h2 className={cn(columnTitleClass, 'mt-2')}>Соцсети</h2>
          <nav aria-label="Соцсети">
            <div className="min-h-8">{social}</div>
          </nav>
        </div>
      </div>

      {copyright && (
        <div className="border-t border-primary-800">
          <div className="mx-auto w-full max-w-content px-4 py-6 md:px-8">
            <p className="text-xs/5 text-primary-300">{copyright}</p>
          </div>
        </div>
      )}
    </footer>
  );
};

export default SiteFooter;
