import { cn } from "@/lib/utils";

interface LabBadgeProps {
  lab: {
    shortName: string;
    name?: string;
    color?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export function LabBadge({ 
  lab, 
  size = 'sm',
  className,
  showTooltip = true 
}: LabBadgeProps) {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  // Generate a consistent color if not provided
  const getLabColor = () => {
    if (lab.color) return lab.color;
    
    // Generate color based on shortName for consistency
    const colors = [
      '#3B82F6', // blue
      '#10B981', // emerald
      '#8B5CF6', // violet
      '#F59E0B', // amber
      '#EF4444', // red
      '#EC4899', // pink
      '#14B8A6', // teal
      '#6366F1', // indigo
    ];
    
    const index = lab.shortName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const labColor = getLabColor();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium ring-1 ring-inset",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${labColor}10`,
        color: labColor,
        borderColor: `${labColor}30`,
      }}
      title={showTooltip ? lab.name : undefined}
    >
      {lab.shortName}
    </span>
  );
}

interface MultiLabBadgeProps {
  labs: Array<{
    shortName: string;
    name?: string;
    color?: string;
  }>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  max?: number;
}

export function MultiLabBadge({ 
  labs, 
  size = 'sm',
  className,
  max = 3
}: MultiLabBadgeProps) {
  const displayLabs = labs.slice(0, max);
  const remainingCount = labs.length - max;

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {displayLabs.map((lab, index) => (
        <LabBadge 
          key={lab.shortName} 
          lab={lab} 
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <span className={cn(
          "inline-flex items-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-medium",
          size === 'xs' && 'text-[10px] px-1.5 py-0.5',
          size === 'sm' && 'text-xs px-2 py-0.5',
          size === 'md' && 'text-sm px-2.5 py-1',
          size === 'lg' && 'text-base px-3 py-1.5'
        )}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}