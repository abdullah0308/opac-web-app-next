import { type ReactNode } from 'react';

type CardTone = 'glass' | 'well' | 'green' | 'gold';

interface CardProps {
  children?: ReactNode;
  className?: string;
  /** Surface treatment. `glass` is the default frosted panel. */
  tone?: CardTone;
  /** Adds hover lift + press response. Use on cards that are links/buttons. */
  interactive?: boolean;
  /** Adds a specular sweep on hover. Implies overflow-hidden. */
  sheen?: boolean;
}

const toneClass: Record<CardTone, string> = {
  glass: 'glass-card',
  well: 'glass-well rounded-glass',
  green: 'glass-green rounded-glass text-white',
  gold: 'glass-card rounded-glass border-l-[3px] border-l-opac-gold',
};

export function Card({
  children,
  className = '',
  tone = 'glass',
  interactive = false,
  sheen = false,
}: CardProps) {
  return (
    <div
      className={[
        toneClass[tone],
        'p-5',
        interactive ? 'glass-interactive' : '',
        sheen ? 'sheen overflow-hidden' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
