import React from 'react';
import { cn } from '@/lib/utils';
import { getStatusColor } from '@/lib/constants/colors';
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  Database, 
  BarChart, 
  BookOpen, 
  Eye, 
  Trophy, 
  Pause, 
  XCircle 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'soft';
}

const statusIcons: Record<string, React.ElementType> = {
  'planning': Clock,
  'irb-submission': FileText,
  'irb-approved': CheckCircle,
  'data-collection': Database,
  'analysis': BarChart,
  'manuscript': BookOpen,
  'under-review': Eye,
  'published': Trophy,
  'on-hold': Pause,
  'cancelled': XCircle,
};

export function StatusBadge({ 
  status, 
  className, 
  showIcon = true, 
  size = 'md',
  variant = 'soft' 
}: StatusBadgeProps) {
  const isDark = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');
  const colors = getStatusColor(status, isDark);
  const Icon = statusIcons[status.toLowerCase().replace(/\s+/g, '-')];
  
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
          backgroundColor: colors.text,
          color: '#ffffff',
          borderColor: colors.text,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: colors.text,
          borderColor: colors.border,
          borderWidth: '1px',
        };
      case 'soft':
      default:
        return {
          backgroundColor: colors.bg,
          color: colors.text,
          borderColor: colors.border,
          borderWidth: '1px',
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  return (
    <span 
      className={cn(
        'status-badge inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-200',
        sizeClasses[size],
        'hover:shadow-sm hover:scale-105',
        className
      )}
      style={variantStyles}
    >
      {showIcon && Icon && (
        <Icon className={cn(iconSizes[size], 'flex-shrink-0')} />
      )}
      <span className="capitalize">
        {status.replace(/-/g, ' ')}
      </span>
    </span>
  );
}