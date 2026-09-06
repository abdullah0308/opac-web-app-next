'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

/**
 * Re-plays a short enter animation whenever the route changes. Children are
 * server-rendered and passed straight through, so this stays a thin wrapper.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
