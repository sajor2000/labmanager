'use client';

import { useKanbanStore, type KanbanViewMode } from '@/lib/store/kanban-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Maximize2,
  Minimize2,
  Layers,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function KanbanViewSwitcher() {
  const { viewMode, setViewMode } = useKanbanStore();

  const viewModes: { value: KanbanViewMode; label: string; icon: React.ReactNode }[] = [
    { value: 'compact', label: 'Compact', icon: <Minimize2 className="h-4 w-4" /> },
    { value: 'comfortable', label: 'Comfortable', icon: <Layers className="h-4 w-4" /> },
    { value: 'expanded', label: 'Expanded', icon: <Maximize2 className="h-4 w-4" /> },
  ];

  const currentView = viewModes.find(v => v.value === viewMode);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {currentView?.icon}
          <span>{currentView?.label}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {viewModes.map((mode) => (
          <DropdownMenuItem
            key={mode.value}
            onClick={() => setViewMode(mode.value)}
            className={cn(
              "gap-2",
              viewMode === mode.value && "bg-accent"
            )}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}