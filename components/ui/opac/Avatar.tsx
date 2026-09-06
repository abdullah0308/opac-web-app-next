import Image from 'next/image';

type AvatarSize = 32 | 48 | 64 | 80;

interface AvatarProps {
  size?: AvatarSize;
  initials?: string;
  src?: string;
  alt?: string;
  className?: string;
  /** Draws a soft green halo — use to mark the signed-in user. */
  ring?: boolean;
}

const fontSizeMap: Record<AvatarSize, string> = {
  32: 'text-[12px]',
  48: 'text-[16px]',
  64: 'text-[22px]',
  80: 'text-[28px]',
};

export function Avatar({
  size = 48,
  initials = 'RM',
  src,
  alt,
  className = '',
  ring = false,
}: AvatarProps) {
  return (
    <div
      className={`relative rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden
        bg-[rgba(212,234,217,0.85)] border border-[rgba(255,255,255,0.8)]
        shadow-[0_2px_8px_-2px_rgba(15,51,32,0.22),inset_0_1px_0_rgba(255,255,255,0.9)]
        ${ring ? 'ring-2 ring-[rgba(46,125,79,0.28)] ring-offset-2 ring-offset-transparent' : ''}
        ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? initials}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        <span
          className={`font-display ${fontSizeMap[size]} text-opac-green leading-none select-none`}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
