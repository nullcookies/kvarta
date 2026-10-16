import { cva } from 'class-variance-authority';
import { cn, FormattedText } from 'drupal-canvas';

const textVariants = cva('my-6', {
  variants: {
    textColor: {
      dark: 'text-body',
      muted: 'text-muted',
      light: 'text-white',
    },
    textSize: {
      extra_small: 'text-xs',
      small: 'text-sm',
      normal: 'text-base/7',
      large: 'text-lg/8',
      extra_large: 'text-xl/8',
    },
  },
  defaultVariants: {
    textColor: 'dark',
    textSize: 'normal',
  },
});

const Text = ({ className, text, textColor = 'dark', textSize = 'normal' }) => {
  return (
    <FormattedText
      className={cn(textVariants({ textColor, textSize }), className)}
    >
      {text}
    </FormattedText>
  );
};

export default Text;
