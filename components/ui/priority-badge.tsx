import React from 'react';
import { cn } from '@/lib/utils';
import { getPriorityColor } from '@/lib/constants/colors';
import { 
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Minus,
  Zap
} from 'lucide-react';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'soft';
  animated?: boolean;
}

const priorityIcons: Record<string, React.ElementType> = {
  'low': ArrowDown,
  'medium': Minus,
  'high': ArrowUp,
  'critical': AlertCircle,
};

export function PriorityBadge({ 
  priority, 
  className, 
  showIcon = true, 
  size = 'md',
  variant = 'soft',
  animated = false
}: PriorityBadgeProps) {
  const isDark = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');
  const colors = getPriorityColor(priority, isDark);
  const Icon = priorityIcons[priority.toLowerCase()];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: colors.icon,
          color: '#ffffff',
          borderColor: colors.icon,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: colors.text,
          borderColor: colors.icon,
          borderWidth: '1px',
        };
      case 'soft':
      default:
        return {
          backgroundColor: colors.bg,
          color: colors.text,
          borderColor: 'transparent',
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  const shouldAnimate = animated && (priority === 'high' || priority === 'critical');
  
  return (
    <span 
      className={cn(
        'priority-indicator inline-flex items-center gap-1.5 font-semibold rounded-md transition-all duration-200',
        sizeClasses[size],
        'hover:shadow-sm hover:scale-105',
        shouldAnimate && priority === 'critical' && 'animate-pulse',
        className
      )}
      style={variantStyles}
    >
      {showIcon && Icon && (
        <Icon 
          className={cn(
            iconSizes[size], 
            'flex-shrink-0',
            shouldAnimate && priority === 'high' && 'animate-bounce'
          )} 
        />
      )}
      {priority === 'critical' && showIcon && (
        <Zap className={cn(iconSizes[size], 'flex-shrink-0 text-yellow-400')} />
      )}
      <span className="capitalize">
        {priority}
      </span>
    </span>
  );
}