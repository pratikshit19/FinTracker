import { cn } from '@/lib/utils';

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string }

export const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <svg
      className={cn('animate-spin text-[var(--accent)]', sizeMap[size], className)}
      viewBox="0 0 24 24" fill="none"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
};
