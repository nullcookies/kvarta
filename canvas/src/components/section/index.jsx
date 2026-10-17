import { cva } from 'class-variance-authority';
import { cn } from 'drupal-canvas';

const sectionVariants = cva('w-full', {
  variants: {
    background: {
      base: 'bg-white text-ink',
      cream: 'bg-cream text-ink',
      dark: 'bg-ink text-white',
      brand: 'bg-brand text-ink',
    },
    verticalPadding: {
      none: 'py-0',
      small: 'py-10',
      medium: 'py-16 md:py-20',
      large: 'py-20 md:py-32',
    },
  },
  defaultVariants: {
    background: 'base',
    verticalPadding: 'medium',
  },
});

const innerVariants = cva('mx-auto w-full', {
  variants: {
    width: {
      normal: 'max-w-(--container-content) px-4 md:px-6',
      wide: 'max-w-none px-4 md:px-6',
      full: 'max-w-none px-0',
    },
  },
  defaultVariants: {
    width: 'normal',
  },
});

const Section = ({
  anchor,
  background = 'base',
  className,
  content,
  verticalPadding = 'medium',
  width = 'normal',
}) => {
  return (
    <section
      id={anchor || undefined}
      className={cn(
        sectionVariants({ background, verticalPadding }),
        className,
      )}
    >
      {content ? (
        <div className={innerVariants({ width })}>{content}</div>
      ) : null}
    </section>
  );
};

export default Section;
