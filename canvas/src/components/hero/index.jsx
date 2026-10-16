import { cva } from 'class-variance-authority';
import { cn, FormattedText } from 'drupal-canvas';

/** Фон первого экрана: тёмный шоколад темы, когда картинки нет. */
const HERO_FALLBACK_BG = 'bg-ink';

/** Затемнение поверх фонового фото. `none` — без затемнения. */
const overlayVariants = cva('absolute inset-0', {
  variants: {
    overlay: {
      none: null,
      light: 'bg-ink/40',
      medium: 'bg-ink/60',
      strong: 'bg-ink/80',
    },
  },
});

/** Цвет текста контента. */
const contentVariants = cva('relative flex w-full flex-col gap-6', {
  variants: {
    textColor: {
      light: 'text-white',
      dark: 'text-ink',
    },
  },
});

/*
 * Цвет заголовка задаём явно: базовый стиль темы красит h1…h6 в тёмный
 * (global.css, @layer base), а он специфичнее наследования от родителя —
 * без класса заголовок на тёмном фото остался бы почти невидимым.
 */
const headingVariants = cva(
  'max-w-4xl font-heading text-4xl leading-[1.08] text-balance uppercase md:text-6xl',
  {
    variants: {
      textColor: {
        light: 'text-white',
        dark: 'text-ink',
      },
    },
  },
);

/** Текст подзаголовка тоже задаём явно — по той же причине. */
const bodyVariants = cva('my-0 max-w-2xl text-base/7 md:text-lg/8', {
  variants: {
    textColor: {
      light: 'text-white/90',
      dark: 'text-body',
    },
  },
});

/** Контурная кнопка второго действия. */
const secondaryButtonVariants = cva(
  'inline-flex items-center justify-center rounded-none border px-7 py-3.5 font-heading text-sm tracking-wider uppercase no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
  {
    variants: {
      textColor: {
        light:
          'border-white/80 text-white hover:border-white hover:bg-white/10 focus:border-white',
        dark: 'border-ink/70 text-ink hover:border-ink hover:bg-ink/10 focus:border-ink',
      },
    },
  },
);

/** Ссылки Canvas приходят строкой или объектом `{ uri }`. */
const resolveLink = (link) => {
  if (!link) {
    return undefined;
  }

  if (typeof link === 'string') {
    return link;
  }

  return link.uri ?? link.url ?? undefined;
};

const Hero = ({
  className,
  eyebrow,
  facts,
  heading,
  image,
  overlay,
  primaryLink,
  primaryText,
  secondaryLink,
  secondaryText,
  text,
  textColor,
}) => {
  const backgroundImageUrl = image?.src ? `url(${image.src})` : undefined;
  const primaryHref = resolveLink(primaryLink);
  const secondaryHref = resolveLink(secondaryLink);

  return (
    <section
      className={cn(
        'relative isolate flex min-h-[560px] w-full flex-col justify-end overflow-hidden bg-cover bg-center bg-no-repeat px-6 py-16 md:min-h-[680px] md:py-24',
        !backgroundImageUrl && HERO_FALLBACK_BG,
        className,
      )}
      style={
        backgroundImageUrl ? { backgroundImage: backgroundImageUrl } : undefined
      }
    >
      {backgroundImageUrl && (
        <div aria-hidden="true" className={overlayVariants({ overlay })} />
      )}

      <div
        className={cn(
          'relative z-10 mx-auto w-full max-w-[1200px]',
          contentVariants({ textColor }),
        )}
      >
        {eyebrow && (
          <p className="font-heading text-sm tracking-[0.18em] text-brand uppercase md:text-base">
            {eyebrow}
          </p>
        )}

        {heading && (
          <h1 className={cn(headingVariants({ textColor }))}>{heading}</h1>
        )}

        {text && (
          <FormattedText className={cn(bodyVariants({ textColor }))}>
            {text}
          </FormattedText>
        )}

        {(primaryText || secondaryText) && (
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {primaryText && (
              <a
                className="inline-flex items-center justify-center rounded-none border border-transparent bg-brand px-8 py-3.5 font-heading text-sm tracking-wider text-ink uppercase no-underline transition-colors hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                href={primaryHref}
              >
                {primaryText}
              </a>
            )}

            {secondaryText && (
              <a
                className={cn(secondaryButtonVariants({ textColor }))}
                href={secondaryHref}
              >
                {secondaryText}
              </a>
            )}
          </div>
        )}

        <div className="mt-4 min-h-8 w-full">{facts}</div>
      </div>
    </section>
  );
};

export default Hero;
