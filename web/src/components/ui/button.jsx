import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const variants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal',
  {
    variants: {
      variant: {
        default: 'bg-yale text-white hover:bg-yale-700',
        accent: 'bg-teal text-white hover:bg-teal-600',
        outline: 'border border-alabaster-200 bg-white hover:bg-alabaster',
        ghost: 'hover:bg-alabaster-200/60',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: { sm: 'h-8 px-3', md: 'h-10 px-4', lg: 'h-12 px-6 text-base' },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);
export function Button({ className, variant, size, asChild, ...props }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(variants({ variant, size }), className)} {...props} />;
}
