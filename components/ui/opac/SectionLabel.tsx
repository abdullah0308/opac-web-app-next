interface SectionLabelProps {
  children?: React.ReactNode;
  text?: string;
  className?: string;
}

export function SectionLabel({ children, text, className = '' }: SectionLabelProps) {
  return (
    <span
      className={`font-body text-[11px] font-semibold text-opac-ink-60 uppercase tracking-[0.08em] leading-none block ${className}`}
    >
      {text ?? children}
    </span>
  );
}
