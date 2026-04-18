import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { label?: string }
>(({ className, children, label, id, ...props }, ref) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && (
      <label htmlFor={id} className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
        {label}
      </label>
    )}
    <SelectPrimitive.Trigger
      ref={ref}
      id={id}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-sm text-[var(--text-primary)] transition-all hover:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown size={14} className="text-[var(--text-muted)]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  </div>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-[var(--radius)] bg-[var(--bg-surface)] border border-[var(--border)] shadow-[var(--shadow-lg)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1 w-[var(--radix-select-trigger-width)]',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-[var(--radius-sm)] py-2 pl-8 pr-3 text-sm text-[var(--text-primary)] outline-none hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check size={12} className="text-[var(--accent)]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
