import Image from 'next/image';

type AvatarSize = 32 | 48 | 64 | 80;

interface AvatarProps {
  size?: AvatarSize;
  initials?: string;
  src?: string;
  alt?: string;
  className?: string;
}

const fontSizeMap: Record<AvatarSize, string> = {
  32: 'text-[12px]',
  48: 'text-[16px]',
  64: 'text-[22px]',
  80: 'text-[28px]',
};

export function Avatar({ size = 48, initials = 'RM', src, alt, className = '' }: AvatarProps) {
  return (
    <div
      className={`rounded-full bg-opac-green-light border-2 border-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.08)] relative ${className}`}
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
