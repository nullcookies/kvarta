import Button from '@/components/button';
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

const contactClass =
  'font-heading text-base tracking-wide text-ink no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark';

/**
 * Шапка региона: логотип текстом, слоган, слот меню, телефон и кнопка заявки.
 * Острые углы и тонкая нижняя граница — как в остальных блоках лендинга.
 */
const SiteHeader = ({
  brand,
  className,
  ctaLink,
  ctaText,
  navigation,
  phone,
  phoneLink,
  sticky,
  tagline,
}) => {
  const phoneHref = resolveLink(phoneLink);
  const ctaHref = resolveLink(ctaLink);

  return (
    <header
      className={cn(
        'w-full border-b border-primary-200 bg-white',
        sticky && 'sticky top-0 z-40',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-4 md:px-8">
        {/* Логотип: Oswald, верхний регистр, всегда ведёт на главную. */}
        <a className="flex min-w-0 flex-col no-underline" href="/">
          <span className="font-heading text-2xl leading-none tracking-[0.08em] text-ink uppercase">
            {brand}
          </span>
          {tagline && (
            <span className="mt-1 text-xs tracking-wide text-body">
              {tagline}
            </span>
          )}
        </a>

        <nav
          aria-label="Основная навигация"
          className="order-last w-full border-t border-primary-200 pt-3 md:order-none md:w-auto md:border-t-0 md:pt-0"
        >
          <div className="min-h-8">{navigation}</div>
        </nav>

        <div className="flex items-center gap-4 md:gap-6">
          {phone &&
            (phoneHref ? (
              <a className={contactClass} href={phoneHref}>
                {phone}
              </a>
            ) : (
              <span className={contactClass}>{phone}</span>
            ))}

          {ctaText && ctaHref && (
            // `solid` у button уже карамельный и с острыми углами; от себя
            // добавляем только Oswald и разрядку, как у остальных CTA лендинга.
            <Button
              className="font-heading tracking-wider"
              link={ctaHref}
              text={ctaText}
              variant="solid"
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
