/**
 * OPAC Design System — Payload CMS Field Annotation
 * Renders a small [cms: collection.field] label for dev reference.
 * Hidden entirely in production builds.
 */

interface CmsTagProps {
  f: string;
  inline?: boolean;
}

export function CmsTag({ f, inline = false }: CmsTagProps) {
  if (process.env.NODE_ENV !== 'development') return null;

  const text = `[cms: ${f}]`;
  const cls =
    'font-mono text-[9px] italic text-opac-ink-30 leading-tight pointer-events-none select-none whitespace-nowrap flex-shrink-0';

  if (inline) {
    return <span className={`${cls} ml-1 align-middle`}>{text}</span>;
  }
  return <div className={`${cls} mt-0.5`}>{text}</div>;
}
