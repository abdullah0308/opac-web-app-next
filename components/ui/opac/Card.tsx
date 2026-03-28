import { type ReactNode } from 'react';

interface CardProps {
  children?: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-opac-card border border-opac-border rounded-[20px] p-5 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
