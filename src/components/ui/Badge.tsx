import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/20',
        success: 'bg-[var(--success-subtle)] text-[var(--success)] border-[var(--success)]/20',
        danger:  'bg-[var(--danger-subtle)] text-[var(--danger)] border-[var(--danger)]/20',
        warning: 'bg-[var(--warning-subtle)] text-[var(--warning)] border-[var(--warning)]/20',
        muted:   'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
Badge.displayName = 'Badge';
