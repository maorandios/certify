import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] disabled:pointer-events-none disabled:opacity-50 min-h-11 px-4",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-brand)] text-[var(--color-brand-foreground)] hover:bg-[var(--color-brand-hover)]",
        secondary:
          "bg-white text-[var(--ink)] border border-[var(--line)] hover:bg-stone-50",
        ghost: "text-[var(--ink)] hover:bg-stone-200/70",
        fab: "size-14 min-h-14 rounded-full bg-[var(--color-brand)] text-white shadow-lg hover:bg-[var(--color-brand-hover)]",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}
