import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-brand text-primary-foreground cursor-pointer hover:scale-[1.02] active:scale-[0.98] border-none",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive/80 cursor-pointer active:scale-[0.98]",
        outline:
          "border border-input bg-background hover:bg-muted hover:text-foreground cursor-pointer transition-colors",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer active:scale-[0.98]",
        ghost: "hover:bg-muted hover:text-foreground cursor-pointer transition-colors",
        link: "text-primary underline-offset-4 hover:underline cursor-pointer",
        hero: "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
        heroOutline:
          "border-2 border-primary text-primary bg-transparent hover:bg-muted cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
