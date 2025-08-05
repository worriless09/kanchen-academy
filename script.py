# Generate all missing UI components and core files

# 1. components/ui/card.tsx
card_component = '''import React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', className)} {...props} />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';'''

# 2. components/ui/button.tsx
button_component = '''import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
      outline: 'border border-gray-300 text-gray-900 bg-white hover:bg-gray-50 focus:ring-blue-400',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400',
      ghost: 'text-gray-900 hover:bg-gray-100 focus:ring-gray-400',
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    if (asChild) {
      return (
        <div
          ref={ref}
          className={cn(
            'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
          {...props}
        />
      );
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';'''

# 3. components/ui/badge.tsx
badge_component = '''import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-blue-100 text-blue-900 border-blue-200',
      secondary: 'bg-gray-100 text-gray-800 border-gray-200',
      destructive: 'bg-red-100 text-red-800 border-red-200',
      outline: 'border border-gray-300 text-gray-700 bg-transparent',
    };
    
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';'''

# 4. components/ui/progress.tsx
progress_component = '''import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6',
    };

    const progressPercent = Math.min(Math.max(value / max, 0), 1) * 100;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size], className)}
        {...props}
      >
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';'''

print("✅ Generated UI Components:")
print("1. Card component")
print("2. Button component") 
print("3. Badge component")
print("4. Progress component")

# Save components to files
with open("card.tsx", "w") as f:
    f.write(card_component)
with open("button.tsx", "w") as f:
    f.write(button_component)
with open("badge.tsx", "w") as f:
    f.write(badge_component)
with open("progress.tsx", "w") as f:
    f.write(progress_component)