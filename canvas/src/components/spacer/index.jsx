import { cva } from 'class-variance-authority';

const spacerVariants = cva('', {
  variants: {
    height: {
      small: 'h-8',
      medium: 'h-12',
      large: 'h-16',
      extra_large: 'h-24',
    },
  },
  defaultVariants: {
    height: 'small',
  },
});

const Spacer = ({ height = 'small' }) => {
  return <div aria-hidden="true" className={spacerVariants({ height })} />;
};

export default Spacer;
