import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'gold' | 'hot' | 'neutral' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'gold', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
        variant === 'gold' && 'bg-gold-500 text-navy-950',
        // "Goryashiy" bejida yorug'lik yugurib turadi — diqqatni tortadi
        variant === 'hot' &&
          'bg-gradient-to-r from-hot-600 via-hot-400 to-hot-600 text-ink animate-shimmer',
        variant === 'neutral' && 'bg-ink/10 text-ink backdrop-blur-sm',
        variant === 'outline' && 'border border-gold-500/50 text-accent',
        className,
      )}
    >
      {children}
    </span>
  );
}
