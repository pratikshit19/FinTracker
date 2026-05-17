import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
  {
    variants: {
      variant: {
        default:  'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
        ghost:    'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
        outline:  'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
        danger:   'bg-[var(--danger-subtle)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white',
        success:  'bg-[var(--success-subtle)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white',
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
  extends Omit<HTMLMotionProps<"button">, "size" | "children">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    // Determine scaling based on variant
    const scaleTap = variant === 'link' ? 1 : 0.95;
    const scaleHover = variant === 'link' ? 1 : 1.02;

    return (
      <motion.button
        ref={ref}
        whileHover={disabled || loading ? {} : { scale: scaleHover }}
        whileTap={disabled || loading ? {} : { scale: scaleTap }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
        {children as any}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
