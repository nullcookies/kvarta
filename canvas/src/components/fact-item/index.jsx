import { cn } from 'drupal-canvas';

/**
 * Один факт: крупное значение и подпись под ним.
 *
 * Цвет задаётся собственным пропом, а не родителем: тема подключает CSS вне
 * слоёв, поэтому цвета приходится объявлять прямыми Utility-классами на самом
 * элементе (они покрыты приоритетным блоком в global.css). Наследование цвета
 * от родителя и селекторы вида `[&_.fact-item-label]` здесь ненадёжны: их
 * перебивает либо тема, либо приоритетный блок.
 */

const valueColor = {
  light: 'text-white',
  dark: 'text-brand-dark',
};

const labelColor = {
  light: 'text-primary-200',
  dark: 'text-body',
};

const FactItem = ({ className, label, textColor = 'dark', value }) => {
  return (
    <div
      className={cn(
        'fact-item flex min-h-8 flex-col gap-1 border-s-2 border-brand/60 ps-4',
        className,
      )}
    >
      {value && (
        <p
          className={cn(
            'fact-item-value font-heading text-3xl leading-none uppercase md:text-4xl',
            valueColor[textColor] ?? valueColor.dark,
          )}
        >
          {value}
        </p>
      )}
      {label && (
        <p
          className={cn(
            'fact-item-label text-sm',
            labelColor[textColor] ?? labelColor.dark,
          )}
        >
          {label}
        </p>
      )}
    </div>
  );
};

export default FactItem;
