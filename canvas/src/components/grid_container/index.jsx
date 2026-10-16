import { cva } from 'class-variance-authority';
import { cn } from 'drupal-canvas';

const gridVariants = cva('grid w-full', {
  variants: {
    layout: {
      '50-50': 'md:grid-cols-[1fr_1fr]',
      '33-33-33': 'md:grid-cols-[1fr_1fr_1fr]',
      '75-25': 'md:grid-cols-[3fr_1fr]',
      '25-75': 'md:grid-cols-[1fr_3fr]',
      '67-33': 'md:grid-cols-[2fr_1fr]',
      '33-67': 'md:grid-cols-[1fr_2fr]',
      '50-25-25': 'md:grid-cols-[2fr_1fr_1fr]',
      '25-25-50': 'md:grid-cols-[1fr_1fr_2fr]',
      '25-25-25-25': 'sm:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr_1fr]',
    },
    gap: {
      extra_small: 'gap-2',
      small: 'gap-4',
      medium: 'gap-6',
      large: 'gap-10',
      extra_large: 'gap-14',
    },
  },
  defaultVariants: {
    gap: 'medium',
    layout: '33-33-33',
  },
});

const GridContainer = ({ layout, gap, className, content, ...props }) => {
  return (
    <div className={cn(gridVariants({ layout, gap }), className)} {...props}>
      {content}
    </div>
  );
};

export default GridContainer;
