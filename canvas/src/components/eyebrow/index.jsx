import { cva } from 'class-variance-authority';
import { cn } from 'drupal-canvas';

const eyebrowVariants = cva(
  'block font-heading text-sm tracking-wide uppercase',
  {
    variants: {
      textColor: {
        brand: 'text-brand',
        accent: 'text-accent-ink',
        muted: 'text-muted',
        light: 'text-white',
      },
    },
    defaultVariants: {
      textColor: 'accent',
    },
  },
);

const Eyebrow = ({ className, text, textColor = 'brand' }) => {
  if (!text) {
    return null;
  }

  return (
    <p className={cn(eyebrowVariants({ textColor }), className)}>{text}</p>
  );
};

export default Eyebrow;
