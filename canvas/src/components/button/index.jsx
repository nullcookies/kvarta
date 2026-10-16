import { cva } from 'class-variance-authority';
import { cn } from 'drupal-canvas';

const baseStyles = {
  disable: 'disabled:pointer-events-none disabled:opacity-50',
  focus:
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:no-underline focus-visible:outline-brand focus-visible:border-transparent',
  svg: '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
};

const buttonVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 px-6 py-3 text-sm font-medium tracking-wide whitespace-nowrap uppercase transition-colors',
    baseStyles.disable,
    baseStyles.focus,
    baseStyles.svg,
  ),
  {
    variants: {
      variant: {
        solid:
          'border border-transparent bg-brand text-ink hover:bg-primary-600 focus:bg-primary-600 active:bg-primary-700',
        outline_dark:
          'border border-ink text-ink hover:bg-ink hover:text-cream focus:bg-ink focus:text-cream active:bg-brand-dark active:text-cream',
        outline_light:
          'border border-white text-white hover:bg-white hover:text-ink focus:bg-white focus:text-ink active:bg-cream active:text-ink',
        ghost:
          'border border-transparent text-brand hover:bg-primary-100 hover:text-primary-800 focus:bg-primary-100 focus:text-primary-800 active:bg-primary-200 active:text-primary-900',
        ghost_neutral:
          'border border-transparent text-body hover:bg-cream hover:text-ink focus:bg-cream focus:text-ink active:bg-primary-200 active:text-ink',
        ghost_light:
          'border border-transparent text-white hover:bg-white/15 focus:bg-white/15 active:bg-white/25',
        link: 'p-0 text-brand hover:text-primary-800 hover:underline hover:underline-offset-2 focus:text-primary-800 active:text-primary-900',
        link_underline:
          'p-0 text-ink underline underline-offset-3 hover:text-brand focus:text-brand active:text-primary-800',
        link_dark:
          'p-0 text-ink hover:text-brand hover:underline hover:underline-offset-3 focus:text-brand active:text-primary-800',
        link_light:
          'p-0 text-white hover:text-primary-200 hover:underline hover:underline-offset-3 focus:text-primary-200 active:text-primary-300',
        nav_link_dark:
          'border-transparent text-ink hover:border-brand hover:text-brand focus:border-brand focus:text-brand active:border-primary-800 active:text-primary-800 md:px-1 md:py-3',
      },
    },
    defaultVariants: {
      variant: 'solid',
    },
  },
);

const Button = ({
  children = '',
  className,
  link,
  text,
  variant,
  ...props
}) => {
  return (
    <a
      className={cn(buttonVariants({ variant }), className)}
      href={link || undefined}
      {...props}
    >
      {text}
      {children}
    </a>
  );
};

export default Button;
