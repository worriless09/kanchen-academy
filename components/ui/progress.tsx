import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // progress value from 0 to 100
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
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export default Progress;
