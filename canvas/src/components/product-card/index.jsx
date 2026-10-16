import { cn, Image } from 'drupal-canvas';

/**
 * Карточка кофе: острые углы, фото 4:3, метка карамелью, внизу вес и цена.
 * Когда фото нет, вместо него остаётся полоса-плейсхолдер той же высоты,
 * чтобы сетка карточек не разъезжалась.
 */
const cardClasses = 'flex h-full w-full flex-col border border-cream bg-white';

const mediaClasses = 'relative aspect-[4/3] w-full overflow-hidden bg-cream';

/** Ссылки Canvas приходят строкой или объектом `{ uri }`. */
const resolveLink = (link) => {
  if (!link) {
    return undefined;
  }

  if (typeof link === 'string') {
    return link;
  }

  return link.uri ?? link.url ?? undefined;
};

const ProductCard = ({
  badge,
  className,
  description,
  image,
  link,
  linkLabel,
  name,
  price,
  weight,
}) => {
  const href = resolveLink(link);
  const hasImage = Boolean(image?.src);
  const hasMeta = Boolean(weight || price);

  return (
    <article className={cn(cardClasses, className)}>
      {hasImage ? (
        <div className={mediaClasses}>
          <Image
            alt={image.alt ?? ''}
            className="h-full w-full object-cover"
            height={image.height}
            src={image.src}
            width={image.width}
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className={cn(
            mediaClasses,
            'border-b border-cream bg-gradient-to-b from-cream to-primary-100',
          )}
        />
      )}

      <div className="flex grow flex-col gap-3 p-6">
        {/* Метка есть не у всех позиций, но место под неё резервируем всегда:
            иначе названия и цены в соседних карточках разъезжаются по высоте. */}
        <p className="min-h-4 font-heading text-xs tracking-[0.18em] text-accent-ink uppercase">
          {badge}
        </p>

        {name && (
          <h3 className="font-heading text-xl leading-tight text-ink uppercase">
            {name}
          </h3>
        )}

        {description && <p className="text-sm text-muted">{description}</p>}

        {hasMeta && (
          <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-cream pt-4">
            {weight && <span className="text-sm text-muted">{weight}</span>}
            {price && (
              <span className="font-heading text-2xl text-ink">{price}</span>
            )}
          </div>
        )}

        {href && linkLabel && (
          <a
            className="text-sm font-semibold text-brand-dark underline underline-offset-4 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            href={href}
          >
            {linkLabel}
          </a>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
