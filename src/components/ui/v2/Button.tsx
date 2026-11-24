import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Ouro com texto navy — par de marca do v2 (>= 4.5:1 nos dois temas)
        default: "bg-gold-500 text-navy-900 hover:bg-gold-400 focus-visible:ring-gold-500",
        destructive:
          "bg-danger-500 text-white hover:bg-danger-400 focus-visible:ring-danger-500",
        outline:
          "border border-border-default bg-transparent text-foreground hover:bg-offwhite-100 focus-visible:ring-gold-500",
        secondary:
          "bg-navy-700 text-white hover:bg-navy-600 focus-visible:ring-navy-500",
        ghost:
          "text-muted-foreground hover:bg-offwhite-100 hover:text-foreground focus-visible:ring-gold-500",
        link: "text-gold-700 underline-offset-4 hover:underline focus-visible:ring-gold-500 dark:text-gold-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
