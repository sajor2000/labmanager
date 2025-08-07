import React from 'react';
import { cn } from '@/lib/utils';
import { PROGRESS_GRADIENTS } from '@/lib/constants/colors';
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle } from 'lucide-react';

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  showTrend?: boolean;
  trendValue?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'linear' | 'circular' | 'steps';
  animated?: boolean;
  showMilestones?: boolean;
  milestones?: { value: number; label: string }[];
  className?: string;
}

export function ProgressIndicator({
  value,
  max = 100,
  label,
  showValue = true,
  showTrend = false,
  trendValue,
  size = 'md',
  variant = 'linear',
  animated = true,
  showMilestones = false,
  milestones = [],
  className,
}: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((value / (max || 100)) * 100, 0), 100);
  
  const getGradient = () => {
    if (percentage < 25) return PROGRESS_GRADIENTS.low;
    if (percentage < 50) return PROGRESS_GRADIENTS.medium;
    if (percentage < 75) return PROGRESS_GRADIENTS.high;
    return PROGRESS_GRADIENTS.complete;
  };

  const sizeClasses = {
    sm: { height: 'h-2', text: 'text-xs', icon: 'h-3 w-3' },
    md: { height: 'h-3', text: 'text-sm', icon: 'h-4 w-4' },
    lg: { height: 'h-4', text: 'text-base', icon: 'h-5 w-5' },
  };

  if (variant === 'circular') {
    return (
      <CircularProgress
        value={value}
        max={max}
        size={size}
        label={label}
        showValue={showValue}
        showTrend={showTrend}
        trendValue={trendValue}
        animated={animated}
        className={className}
      />
    );
  }

  if (variant === 'steps') {
    return (
      <StepsProgress
        value={value}
        max={max}
        size={size}
        label={label}
        milestones={milestones}
        animated={animated}
        className={className}
      />
    );
  }

  // Linear Progress (default)
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      {(label || showValue || showTrend) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {label && (
              <span className={cn('font-medium', sizeClasses[size].text)}>
                {label}
              </span>
            )}
            {showTrend && trendValue !== undefined && (
              <TrendIndicator value={trendValue} size={size} />
            )}
          </div>
          {showValue && (
            <span className={cn('font-semibold', sizeClasses[size].text)}>
              {value}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative">
        <div 
          className={cn(
            'progress-animated rounded-full overflow-hidden',
            sizeClasses[size].height
          )}
        >
          <div
            className={cn(
              'progress-bar h-full rounded-full transition-all duration-500 ease-out',
              animated && 'animate-slide-in'
            )}
            style={{
              width: `${percentage}%`,
              background: getGradient(),
            }}
          />
        </div>

        {/* Milestones */}
        {showMilestones && milestones.length > 0 && (
          <div className="absolute inset-0">
            {milestones.map((milestone, index) => {
              const position = (milestone.value / max) * 100;
              const isPassed = value >= milestone.value;
              
              return (
                <div
                  key={index}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${position}%` }}
                >
                  <div
                    className={cn(
                      'w-1 h-6 -translate-x-1/2 transition-colors duration-300',
                      isPassed ? 'bg-white/80' : 'bg-gray-400 dark:bg-gray-600'
                    )}
                  />
                  <span 
                    className={cn(
                      'absolute top-8 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap',
                      isPassed ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'
                    )}
                  >
                    {milestone.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion Status */}
      {percentage === 100 && animated && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-fade-in">
          <CheckCircle className={sizeClasses[size].icon} />
          <span className={sizeClasses[size].text}>Complete!</span>
        </div>
      )}
    </div>
  );
}

// Circular Progress Component
function CircularProgress({
  value,
  max,
  size,
  label,
  showValue,
  showTrend,
  trendValue,
  animated,
  className,
}: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((value / (max || 100)) * 100, 0), 100);
  const radius = size === 'sm' ? 30 : size === 'md' ? 40 : 50;
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        className={cn(
          'transform -rotate-90',
          animated && 'animate-scale-in'
        )}
        width={radius * 2 + strokeWidth * 2}
        height={radius * 2 + strokeWidth * 2}
      >
        {/* Background Circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress Circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-500 ease-out',
            animated && 'animate-draw'
          )}
          style={{
            animation: animated ? `draw 1s ease-out` : undefined,
          }}
        />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span className={cn(
            'font-bold',
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-2xl'
          )}>
            {value}%
          </span>
        )}
        {label && (
          <span className={cn(
            'text-gray-500 dark:text-gray-400',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
            {label}
          </span>
        )}
        {showTrend && trendValue !== undefined && (
          <TrendIndicator value={trendValue} size="sm" />
        )}
      </div>
    </div>
  );
}

// Steps Progress Component
function StepsProgress({
  value,
  max,
  size,
  label,
  milestones,
  animated,
  className,
}: ProgressIndicatorProps) {
  const currentStep = Math.floor((value / (max || 100)) * (milestones?.length || 0));
  
  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <h4 className={cn(
          'font-medium',
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
        )}>
          {label}
        </h4>
      )}
      
      <div className="flex items-center justify-between">
        {milestones?.map((milestone, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <React.Fragment key={index}>
              <div 
                className={cn(
                  'flex flex-col items-center gap-2',
                  animated && 'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={cn(
                    'rounded-full flex items-center justify-center transition-all duration-300',
                    size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-10 w-10' : 'h-12 w-12',
                    isCompleted ? 'bg-green-500 text-white' : 
                    isActive ? 'bg-blue-500 text-white animate-pulse' : 
                    'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
                  ) : (
                    <span className={cn(
                      'font-semibold',
                      size === 'sm' ? 'text-xs' : 'text-sm'
                    )}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-center',
                  size === 'sm' ? 'text-xs' : 'text-sm',
                  isActive ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'
                )}>
                  {milestone.label}
                </span>
              </div>
              
              {index < milestones.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-2',
                    'relative overflow-hidden'
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-blue-500',
                      'rounded-full transition-all duration-500',
                      isCompleted && 'w-full',
                      isActive && animated && 'animate-progress'
                    )}
                    style={{
                      width: isCompleted ? '100%' : isActive ? '50%' : '0%',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Trend Indicator Component
function TrendIndicator({ value, size }: { value: number; size: string }) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  if (value > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <TrendingUp className={sizeClasses[size as keyof typeof sizeClasses]} />
        <span className="text-xs font-medium">+{value}%</span>
      </div>
    );
  }
  
  if (value < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
        <TrendingDown className={sizeClasses[size as keyof typeof sizeClasses]} />
        <span className="text-xs font-medium">{value}%</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1 text-gray-500">
      <Minus className={sizeClasses[size as keyof typeof sizeClasses]} />
      <span className="text-xs font-medium">0%</span>
    </div>
  );
}

// Add animation keyframes to globals.css
const animationStyles = `
@keyframes draw {
  from {
    stroke-dashoffset: var(--circumference);
  }
  to {
    stroke-dashoffset: var(--dashoffset);
  }
}

@keyframes animate-progress {
  from {
    width: 0%;
  }
  to {
    width: 50%;
  }
}
`;