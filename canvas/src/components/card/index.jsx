import Button from '@/components/button';
import Heading from '@/components/heading';
import { cva } from 'class-variance-authority';
import { cn, FormattedText, Image } from 'drupal-canvas';

// Фоны карточки — только токены темы. Значения — из фиксированного набора,
// чтобы в вёрстку не попадали произвольные hex-цвета.
const backgroundPresets = {
  paper: {
    base: 'bg-white',
    hover: 'hover:bg-primary-50',
  },
  cream: {
    base: 'bg-cream',
    hover: 'hover:bg-primary-100',
  },
  caramel: {
    base: 'bg-primary-100',
    hover: 'hover:bg-primary-200',
  },
  ink: {
    base: 'bg-ink text-white',
    hover: 'hover:bg-primary-900',
  },
  brand: {
    base: 'bg-brand',
    hover: 'hover:bg-primary-600',
  },
};

// Старые hex-значения из моков и страниц переводим в ближайший токен темы.
const legacyBackgroundAliases = {
  '#ffffff': 'paper',
  '#f0f9ff': 'paper',
  '#e0f2fe': 'cream',
  '#e2e8f0': 'caramel',
  '#ebe7de': 'cream',
  '#30271c': 'ink',
  '#c7a17a': 'brand',
};

const backgroundPreset = (value, fallback) => {
  if (!value) {
    return backgroundPresets[fallback];
  }

  const key = String(value).trim().toLowerCase();

  return (
    backgroundPresets[legacyBackgroundAliases[key] ?? key] ??
    backgroundPresets[fallback]
  );
};

const cardVariants = cva(
  'flex w-full max-w-md flex-col items-center gap-4 bg-white pb-6 leading-[normal]',
  {
    variants: {
      layout: {
        left_aligned: 'items-start text-left',
        center_aligned: 'items-center text-center',
        right_aligned: 'items-end text-right',
      },
      textColor: {
        Default: null,
        Dark: 'text-ink',
        Light: 'text-white',
      },
      image: {
        true: null,
        false: 'pt-8',
      },
    },
    defaultVariants: {
      textColor: 'Default',
    },
  },
);

const linkCardStyles =
  'group flex flex-col border border-primary-200 bg-white transition hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

const ChevronIcon = () => (
  <svg
    className="size-5 shrink-0 text-ink transition-colors group-hover:text-brand"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const linkCardTextAlign = {
  left_aligned: 'text-left',
  center_aligned: 'text-center',
  right_aligned: 'text-right',
};

const LinkCard = ({
  className,
  heading,
  text,
  image,
  link,
  layout = 'left_aligned',
}) => (
  <a className={cn(linkCardStyles, className)} href={link || undefined}>
    <div className="p-4 md:p-5">
      <div className="flex items-center justify-between gap-x-3">
        <div className="flex grow items-center gap-x-3">
          {image?.src && (
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="size-10 object-cover"
              sizes="40px"
            />
          )}
          <div className={cn('grow', linkCardTextAlign[layout])}>
            <h3 className="font-heading text-ink uppercase transition-colors group-hover:text-brand">
              {heading}
            </h3>
            {text && (
              <p className="text-sm text-muted">
                <FormattedText>{text}</FormattedText>
              </p>
            )}
          </div>
        </div>
        <ChevronIcon />
      </div>
    </div>
  </a>
);

const DefaultCard = ({
  backgroundColor,
  backgroundColorOnHover,
  byline,
  className,
  image,
  heading,
  headingElement = 'h2',
  layout = 'left_aligned',
  link,
  linkLabel,
  linkVariant = 'link',
  text,
  textColor,
}) => {
  const { src, alt, width, height } = image ?? {};
  const hasImage = !!src;

  const cardContent = (
    <div
      className={cn(
        cardVariants({ layout, textColor, image: hasImage }),
        backgroundPreset(backgroundColor, 'paper').base,
        backgroundPreset(backgroundColorOnHover, 'caramel').hover,
        className,
      )}
    >
      {hasImage && (
        <Image
          {...{ src, alt, width, height }}
          className="w-full object-cover object-center"
        />
      )}
      <div className="px-6 pt-2">
        {heading && (
          <Heading
            className="mb-2"
            heading={heading}
            headingElement={headingElement}
            headingSize="small"
            layout={layout}
            textColor={textColor}
          />
        )}
        {byline && (
          <div className="mt-3 mb-2 text-xs font-semibold text-muted">
            {byline}
          </div>
        )}
        {text && (
          <FormattedText className="mb-4 leading-6">{text}</FormattedText>
        )}
        {link && linkLabel && (
          <Button link={link} variant={linkVariant}>
            {linkLabel}
          </Button>
        )}
      </div>
    </div>
  );

  return link && !linkLabel ? <a href={link}>{cardContent}</a> : cardContent;
};

const Card = ({ variant = 'default', ...props }) => {
  switch (variant) {
    case 'link_card':
      return <LinkCard {...props} />;
    default:
      return <DefaultCard {...props} />;
  }
};

export default Card;
