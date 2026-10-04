import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-yale text-white hover:bg-yale-700',
        accent: 'bg-teal text-white hover:bg-teal-600',
        outline: 'border border-line bg-white text-ink hover:border-yale/40 hover:bg-alabaster',
        ghost: 'text-ink hover:bg-alabaster-200/70',
        danger: 'bg-danger text-white hover:bg-danger-700',
        mint: 'bg-mint text-yale-900 hover:bg-mint-600',
        onDark: 'bg-white text-yale hover:bg-teal-50',
        outlineOnDark: 'border border-white/50 text-white hover:bg-white/10',
      },
      size: { sm: 'h-10 px-3 max-md:h-11', md: 'h-11 px-4', lg: 'h-12 px-6 text-base', icon: 'h-11 w-11' },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export function Button({ className, variant, size, asChild, loading, children, disabled, ...props }) {
  const Comp = asChild ? Slot : 'button';
  if (asChild) return <Comp className={cn(variants({ variant, size }), className)} {...props}>{children}</Comp>;
  return (
    <Comp className={cn(variants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{children}
    </Comp>
  );
}
