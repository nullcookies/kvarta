import { cva } from 'class-variance-authority';
import { cn } from 'drupal-canvas';

/**
 * Контейнер пунктов меню. Цвет текста задаётся здесь и наследуется
 * `nav-link`: ссылка берёт `currentColor`, поэтому пункт меню остаётся
 * самостоятельным компонентом без собственного пропа цвета.
 * `min-h-8` держит слот `items` кликабельным, пока он пуст.
 */
const listVariants = cva(
  'flex min-h-8 list-none flex-wrap items-center gap-x-6 gap-y-2',
  {
    variants: {
      alignment: {
        left_aligned: 'justify-start text-left',
        center_aligned: 'justify-center text-center',
        right_aligned: 'justify-end text-right',
      },
      textColor: {
        dark: 'text-ink',
        light: 'text-cream',
      },
    },
    defaultVariants: {
      alignment: 'left_aligned',
      textColor: 'dark',
    },
  },
);

const NavLinks = ({ alignment, className, items, textColor }) => {
  return (
    <ul className={cn(listVariants({ alignment, textColor }), className)}>
      {items}
    </ul>
  );
};

export default NavLinks;
