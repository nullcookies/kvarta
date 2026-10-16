import { cva } from 'class-variance-authority';
import { cn } from 'drupal-canvas';

const containerVariants = cva('flex w-full flex-col gap-3', {
  variants: {
    layout: {
      left_aligned: 'items-start text-left',
      center_aligned: 'items-center text-center',
      right_aligned: 'items-end text-right',
    },
  },
  defaultVariants: {
    layout: 'left_aligned',
  },
});

const preHeadingVariants = cva('font-heading text-sm tracking-wide uppercase', {
  variants: {
    textColor: {
      // Надзаголовок на светлом фоне: тёмная карамель, у primary-500 контраст
      // с белым всего ~2,2:1 и текст нечитаем.
      dark: 'text-accent-ink',
      light: 'text-brand',
      brand: 'text-accent-ink',
      muted: 'text-muted',
    },
  },
});

const headingVariants = cva('font-heading text-balance uppercase', {
  variants: {
    textColor: {
      dark: 'text-ink',
      light: 'text-white',
      brand: 'text-brand',
      muted: 'text-muted',
    },
    headingSize: {
      extra_large: 'text-4xl leading-none md:text-6xl',
      large: 'text-3xl leading-tight md:text-4xl',
      medium: 'text-2xl leading-tight md:text-3xl',
      small: 'text-xl leading-snug md:text-2xl',
    },
  },
  defaultVariants: {
    headingSize: 'large',
    textColor: 'dark',
  },
});

const Heading = ({
  className,
  heading,
  headingElement = 'h2',
  headingSize = 'large',
  layout = 'left_aligned',
  preHeading,
  textColor = 'dark',
}) => {
  const HeadingTag = headingElement;

  if (!heading && !preHeading) {
    return null;
  }

  return (
    <div className={cn(containerVariants({ layout }), className)}>
      {preHeading ? (
        <div className={preHeadingVariants({ textColor })}>{preHeading}</div>
      ) : null}
      {heading ? (
        <HeadingTag className={headingVariants({ headingSize, textColor })}>
          {heading}
        </HeadingTag>
      ) : null}
    </div>
  );
};

export default Heading;
