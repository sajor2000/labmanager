'use client';

import React from 'react';
import { 
  Grid3x3, Kanban, Calendar, Image, FormInput, 
  Timeline, BarChart3, Map, Table2, Layers,
  ChevronRight, Plus, Lock, Eye, Star
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import type { ViewType } from '@/types';

interface ViewOption {
  id: ViewType;
  name: string;
  icon: React.ReactNode;
  path: string;
  description: string;
  isPremium?: boolean;
  isNew?: boolean;
  comingSoon?: boolean;
  shortcut?: string;
}

const viewOptions: ViewOption[] = [
  {
    id: 'TABLE',
    name: 'Grid',
    icon: <Grid3x3 className="h-4 w-4" />,
    path: '/grid',
    description: 'Spreadsheet-like table with sortable columns',
    shortcut: '⌘1',
  },
  {
    id: 'KANBAN',
    name: 'Kanban',
    icon: <Kanban className="h-4 w-4" />,
    path: '/stacked',
    description: 'Drag-and-drop card board organized by status',
    shortcut: '⌘2',
  },
  {
    id: 'CALENDAR',
    name: 'Calendar',
    icon: <Calendar className="h-4 w-4" />,
    path: '/calendar',
    description: 'View records on a monthly calendar',
    shortcut: '⌘3',
  },
  {
    id: 'GALLERY',
    name: 'Gallery',
    icon: <Image className="h-4 w-4" />,
    path: '/gallery',
    description: 'Visual card gallery with images',
    shortcut: '⌘4',
    isNew: true,
  },
  {
    id: 'TIMELINE',
    name: 'Timeline',
    icon: <Timeline className="h-4 w-4" />,
    path: '/timeline',
    description: 'Horizontal timeline for project planning',
    shortcut: '⌘5',
    isPremium: true,
  },
  {
    id: 'GANTT',
    name: 'Gantt',
    icon: <BarChart3 className="h-4 w-4 rotate-90" />,
    path: '/gantt',
    description: 'Advanced project timeline with dependencies',
    shortcut: '⌘6',
    isPremium: true,
  },
  {
    id: 'FORM',
    name: 'Form',
    icon: <FormInput className="h-4 w-4" />,
    path: '/form',
    description: 'Shareable form for data collection',
    shortcut: '⌘7',
  },
  {
    id: 'MAP',
    name: 'Map',
    icon: <Map className="h-4 w-4" />,
    path: '/map',
    description: 'Geographic visualization of data',
    shortcut: '⌘8',
    comingSoon: true,
  },
];

interface ViewTypeSwitcherProps {
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  variant?: 'default' | 'compact' | 'expanded';
  showLabels?: boolean;
  showShortcuts?: boolean;
  className?: string;
}

export function ViewTypeSwitcher({
  currentView,
  onViewChange,
  variant = 'default',
  showLabels = false,
  showShortcuts = false,
  className,
}: ViewTypeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Determine current view from pathname if not provided
  const getCurrentView = (): ViewType => {
    if (currentView) return currentView;
    
    const pathMap: Record<string, ViewType> = {
      '/grid': 'TABLE',
      '/stacked': 'KANBAN',
      '/calendar': 'CALENDAR',
      '/gallery': 'GALLERY',
      '/timeline': 'TIMELINE',
      '/gantt': 'GANTT',
      '/form': 'FORM',
      '/map': 'MAP',
    };
    
    for (const [path, view] of Object.entries(pathMap)) {
      if (pathname.includes(path)) return view;
    }
    
    return 'KANBAN'; // Default
  };
  
  const activeView = getCurrentView();
  
  const handleViewChange = (view: ViewOption) => {
    if (view.comingSoon) {
      // Show coming soon toast or modal
      return;
    }
    
    onViewChange?.(view.id);
    router.push(view.path);
  };
  
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center bg-muted rounded-lg p-0.5", className)}>
        <TooltipProvider>
          {viewOptions.filter(v => !v.comingSoon).map((view) => (
            <Tooltip key={view.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeView === view.id ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 px-2 relative",
                    activeView === view.id && "shadow-sm"
                  )}
                  onClick={() => handleViewChange(view)}
                  disabled={view.comingSoon}
                >
                  {view.icon}
                  {view.isNew && (
                    <Badge 
                      variant="default" 
                      className="absolute -top-1 -right-1 h-3 px-1 text-[8px] bg-green-500"
                    >
                      NEW
                    </Badge>
                  )}
                  {view.isPremium && (
                    <Lock className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-yellow-500" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{view.name}</p>
                    {showShortcuts && view.shortcut && (
                      <kbd className="text-xs bg-muted px-1 rounded">{view.shortcut}</kbd>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{view.description}</p>
                  {view.isPremium && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Premium feature
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    );
  }
  
  if (variant === 'expanded') {
    return (
      <div className={cn("space-y-1", className)}>
        {viewOptions.map((view) => (
          <Button
            key={view.id}
            variant={activeView === view.id ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "w-full justify-start gap-3 relative",
              view.comingSoon && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => handleViewChange(view)}
            disabled={view.comingSoon}
          >
            <div className="flex items-center gap-3 flex-1">
              {view.icon}
              <span className="flex-1 text-left">{view.name}</span>
              {view.isNew && (
                <Badge variant="default" className="h-4 text-[10px] px-1 bg-green-500">
                  NEW
                </Badge>
              )}
              {view.isPremium && (
                <Lock className="h-3 w-3 text-yellow-500" />
              )}
              {view.comingSoon && (
                <Badge variant="secondary" className="h-4 text-[10px] px-1">
                  SOON
                </Badge>
              )}
              {showShortcuts && view.shortcut && (
                <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded ml-auto">
                  {view.shortcut}
                </kbd>
              )}
            </div>
            {activeView === view.id && (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ))}
        
        {/* Divider */}
        <div className="h-px bg-border my-2" />
        
        {/* Create custom view */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3"
          onClick={() => {/* Open create view modal */}}
        >
          <Plus className="h-4 w-4" />
          <span>Create custom view</span>
        </Button>
      </div>
    );
  }
  
  // Default variant - horizontal list with optional labels
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <TooltipProvider>
        {viewOptions.filter(v => !v.comingSoon).map((view) => (
          <Tooltip key={view.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === view.id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2 relative",
                  !showLabels && "px-2"
                )}
                onClick={() => handleViewChange(view)}
                disabled={view.comingSoon}
              >
                {view.icon}
                {showLabels && <span>{view.name}</span>}
                {view.isNew && !showLabels && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />
                )}
                {view.isPremium && !showLabels && (
                  <Lock className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-yellow-500" />
                )}
              </Button>
            </TooltipTrigger>
            {!showLabels && (
              <TooltipContent side="bottom" className="max-w-[200px]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{view.name}</p>
                    {showShortcuts && view.shortcut && (
                      <kbd className="text-xs bg-muted px-1 rounded">{view.shortcut}</kbd>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{view.description}</p>
                  {view.isPremium && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Premium feature
                    </p>
                  )}
                  {view.isNew && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✨ New feature
                    </p>
                  )}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </TooltipProvider>
      
      {/* More views dropdown */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>More view options</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}