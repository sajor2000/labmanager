'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Table2,
  LayoutGrid,
  Calendar,
  GitBranch,
  BarChart3,
  Users,
  ChevronDown,
  Check,
  Settings2,
  Save,
} from 'lucide-react';

export type ViewType = 'table' | 'kanban' | 'calendar' | 'timeline' | 'workload' | 'analytics';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
  showLabels?: boolean;
  onSaveView?: () => void;
  savedViews?: { id: string; name: string; type: ViewType }[];
}

const viewOptions = [
  { id: 'table', label: 'Table', icon: Table2, description: 'Traditional table view' },
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid, description: 'Drag and drop board' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, description: 'Monthly calendar view' },
  { id: 'timeline', label: 'Timeline', icon: GitBranch, description: 'Gantt chart view' },
  { id: 'workload', label: 'Workload', icon: Users, description: 'Team capacity view' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Charts and insights' },
] as const;

export function ViewSwitcher({ 
  currentView, 
  onViewChange, 
  className,
  showLabels = false,
  onSaveView,
  savedViews = []
}: ViewSwitcherProps) {
  const currentViewOption = viewOptions.find(v => v.id === currentView) || viewOptions[0];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Quick View Buttons */}
      <div className="hidden md:flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {viewOptions.slice(0, 3).map((view) => {
          const Icon = view.icon;
          const isActive = currentView === view.id;
          
          return (
            <Button
              key={view.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(view.id as ViewType)}
              className={cn(
                'transition-all duration-200',
                isActive && 'shadow-sm'
              )}
              title={view.label}
            >
              <Icon className="h-4 w-4" />
              {showLabels && <span className="ml-2">{view.label}</span>}
            </Button>
          );
        })}
      </div>

      {/* All Views Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <currentViewOption.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{currentViewOption.label} View</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>View Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {viewOptions.map((view) => {
            const Icon = view.icon;
            const isActive = currentView === view.id;
            
            return (
              <DropdownMenuItem
                key={view.id}
                onClick={() => onViewChange(view.id as ViewType)}
                className="gap-3"
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{view.label}</span>
                    {isActive && <Check className="h-4 w-4" />}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {view.description}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
          
          {(savedViews.length > 0 || onSaveView) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
              {savedViews.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => onViewChange(view.type)}
                  className="gap-3"
                >
                  <Save className="h-4 w-4" />
                  <span>{view.name}</span>
                </DropdownMenuItem>
              ))}
              {onSaveView && (
                <DropdownMenuItem onClick={onSaveView} className="gap-3">
                  <Save className="h-4 w-4" />
                  <span>Save Current View</span>
                </DropdownMenuItem>
              )}
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-3">
            <Settings2 className="h-4 w-4" />
            <span>Customize View</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}