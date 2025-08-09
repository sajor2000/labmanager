import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "btn-rush-primary",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-muted hover:text-accent-foreground dark:hover:bg-slack-bg-hover",
        secondary:
          "btn-rush-secondary",
        ghost: "hover:bg-muted hover:text-accent-foreground dark:hover:bg-slack-bg-hover",
        link: "text-primary underline-offset-4 hover:underline dark:text-rush-gold-light",
        rush: "bg-rush-green text-white hover:bg-rush-green/90 dark:bg-rush-green-light dark:hover:bg-rush-green-light/80",
        gold: "bg-rush-gold text-rush-green hover:bg-rush-gold/90 dark:bg-rush-gold-light dark:text-slack-bg-main dark:hover:bg-rush-gold-light/80",
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
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, type = 'button', disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Create a stable click handler that prevents issues in production
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      // Don't do anything if button is disabled
      if (disabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // For non-submit buttons in forms, prevent default to avoid accidental form submission
      if (type !== 'submit' && type !== 'reset') {
        // Check if button is inside a form
        const form = (e.target as HTMLElement).closest('form');
        if (form) {
          e.preventDefault();
        }
      }
      
      // Call the onClick handler if it exists and is a function
      if (onClick && typeof onClick === 'function') {
        try {
          onClick(e);
        } catch (error) {
          console.error('Button onClick handler error:', error);
        }
      }
    }, [onClick, type, disabled]);
    
    // Ensure button has proper type attribute
    const buttonType = type || 'button';
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          // Add cursor styles for better UX
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        )}
        ref={ref}
        type={buttonType}
        disabled={disabled}
        onClick={asChild ? onClick : handleClick}
        aria-disabled={disabled}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }