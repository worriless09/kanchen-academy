import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'gradient' | 'glow'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group",
          {
            // Variants
            'bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0': variant === 'default',
            'border-2 border-primary text-primary hover:bg-primary hover:text-white hover:scale-105': variant === 'outline',
            'text-primary hover:bg-primary/10 hover:scale-105': variant === 'ghost',
            'bg-gradient-to-r from-primary to-primary-dark text-white hover:from-primary-dark hover:to-primary hover:shadow-xl hover:-translate-y-1 btn-primary': variant === 'gradient',
            'bg-primary text-white hover:bg-primary-dark animate-glow-pulse': variant === 'glow',
            
            // Sizes
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
            'px-8 py-4 text-xl': size === 'xl',
          },
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg 
            className="animate-spin -ml-1 mr-3 h-5 w-5" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className="relative z-10">{children}</span>
        
        {/* Ripple effect */}
        <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
