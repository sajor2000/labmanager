import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'progress';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function LoadingState({ 
  variant = 'spinner', 
  size = 'md',
  message,
  className 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      {variant === 'spinner' && <SpinnerLoader size={sizeClasses[size]} />}
      {variant === 'dots' && <DotsLoader size={size} />}
      {variant === 'pulse' && <PulseLoader size={size} />}
      {variant === 'progress' && <ProgressLoader />}
      
      {message && (
        <p className={cn(
          'text-gray-500 dark:text-gray-400 animate-fade-in',
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        )}>
          {message}
        </p>
      )}
    </div>
  );
}

function SpinnerLoader({ size }: { size: string }) {
  return (
    <div className={cn(size, 'relative')}>
      <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
    </div>
  );
}

function DotsLoader({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const dotSize = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            dotSize[size],
            'rounded-full bg-blue-500 animate-bounce'
          )}
          style={{
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </div>
  );
}

function PulseLoader({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const pulseSize = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="relative">
      <div className={cn(pulseSize[size], 'rounded-full bg-blue-500 animate-ping absolute')} />
      <div className={cn(pulseSize[size], 'rounded-full bg-blue-500')} />
    </div>
  );
}

function ProgressLoader() {
  return (
    <div className="w-48 space-y-2">
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-progress-slide" />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Loading...</span>
        <span className="animate-pulse">Please wait</span>
      </div>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg', className)}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 skeleton rounded" />
          <div className="h-3 w-1/2 skeleton rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 skeleton rounded" />
        <div className="h-3 skeleton rounded" />
        <div className="h-3 w-4/5 skeleton rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 skeleton rounded-full" />
        <div className="h-6 w-20 skeleton rounded-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 h-4 skeleton rounded" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg">
          {[1, 2, 3, 4, 5].map((j) => (
            <div 
              key={j} 
              className="flex-1 h-4 skeleton rounded"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Add to globals.css
const animationStyles = `
@keyframes progress-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

.animate-progress-slide {
  animation: progress-slide 1.5s ease-in-out infinite;
}
`;