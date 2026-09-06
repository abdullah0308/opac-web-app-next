'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  /** Rendered before the number, e.g. "#" or "Rs " */
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
  /** Adds thousands separators. */
  locale?: boolean;
}

/**
 * Counts a stat up from zero on mount. Honours prefers-reduced-motion by
 * rendering the final value immediately.
 */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  durationMs = 900,
  className = '',
  locale = false,
}: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || value === 0) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    setDisplay(0);

    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      // easeOutExpo — fast out of the gate, settles softly
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs]);

  return (
    <span className={className}>
      {prefix}
      {locale ? display.toLocaleString() : display}
      {suffix}
    </span>
  );
}
