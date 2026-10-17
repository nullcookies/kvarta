import { cn } from 'drupal-canvas';

/** Canvas отдаёт ссылки строкой или объектом `{ uri }`. */
const resolveLink = (link) => {
  if (!link) {
    return undefined;
  }

  if (typeof link === 'string') {
    return link;
  }

  return link.uri ?? link.url ?? undefined;
};

const NavLink = ({ className, label, link }) => {
  return (
    <div className={cn('min-h-0', className)}>
      <a
        className="inline-flex items-center py-1 text-inherit no-underline underline-offset-4 transition-colors hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        href={resolveLink(link)}
      >
        {label}
      </a>
    </div>
  );
};

export default NavLink;
