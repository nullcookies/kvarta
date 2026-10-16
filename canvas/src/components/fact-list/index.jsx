import { cva } from 'class-variance-authority';
import { cn } from 'drupal-canvas';

/**
 * Сетка фактов: на мобильном всегда две узкие колонки, с `lg` — `columns`.
 * Классы перечислены явно, чтобы Tailwind видел их при сканировании.
 * `min-h-8` держит слот `items` кликабельным, пока он пуст.
 *
 * Цвета темы задаются здесь и доходят до `fact-item` через селекторы потомка,
 * поэтому `fact-item` остаётся самостоятельным компонентом.
 */
const listVariants = cva(
  'grid min-h-8 grid-cols-2 gap-x-6 gap-y-8 lg:gap-x-10',
  {
    variants: {
      columns: {
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
      },
      textColor: {
        light:
          '[&_.fact-item-label]:text-primary-200 [&_.fact-item-value]:text-white',
        dark: '[&_.fact-item-label]:text-body [&_.fact-item-value]:text-brand-dark',
      },
    },
    defaultVariants: {
      columns: '3',
      textColor: 'light',
    },
  },
);

const FactList = ({ className, columns, items, textColor }) => {
  return (
    <div className={cn(listVariants({ columns, textColor }), className)}>
      {items}
    </div>
  );
};

export default FactList;
