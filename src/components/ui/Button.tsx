import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
  {
    variants: {
      variant: {
        default:  'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.97]',
        ghost:    'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.97]',
        outline:  'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.97]',
        danger:   'bg-[var(--danger-subtle)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white active:scale-[0.97]',
        success:  'bg-[var(--success-subtle)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white active:scale-[0.97]',
        link:     'bg-transparent text-[var(--accent)] hover:text-[var(--accent-hover)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm:   'h-8 px-3 text-xs',
        md:   'h-9 px-4 text-sm',
        lg:   'h-10 px-5 text-sm',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
