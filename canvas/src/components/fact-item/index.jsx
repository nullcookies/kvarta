import { cn } from 'drupal-canvas';

/**
 * Один факт: крупное значение и подпись под ним.
 * Цвета значения и подписи задаёт родитель `fact-list` через классы
 * `fact-item-value` и `fact-item-label`; карамельная черта слева — своя.
 */
const FactItem = ({ className, label, value }) => {
  return (
    <div
      className={cn(
        'fact-item flex min-h-8 flex-col gap-1',
        'border-s-2 border-brand/60 ps-4',
        className,
      )}
    >
      {value && (
        <p className="fact-item-value font-heading text-3xl leading-none text-brand-dark uppercase md:text-4xl">
          {value}
        </p>
      )}
      {label && <p className="fact-item-label text-sm text-body">{label}</p>}
    </div>
  );
};

export default FactItem;
