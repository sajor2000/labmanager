'use client';

import { useEffect, useState } from 'react';
import { useKanbanStore } from '@/lib/store/kanban-store';
import { ProjectKanbanBoard } from '@/components/kanban/project-kanban-board';
import { KanbanFilters } from '@/components/kanban/kanban-filters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Layers,
  Minimize2,
  Calendar,
  RefreshCw,
  Plus,
  Settings,
} from 'lucide-react';

export default function KanbanPage() {
  const {
    isLoading,
    error,
    viewMode,
    filters,
    refreshData,
    setViewMode,
    projects,
  } = useKanbanStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleCreateProject = () => {
    setShowCreateDialog(true);
    // TODO: Implement project creation dialog
  };

  const viewModes = [
    { id: 'standard', label: 'Standard', icon: LayoutGrid },
    { id: 'swimlane', label: 'Swimlane', icon: Layers },
    { id: 'compact', label: 'Compact', icon: Minimize2 },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Project Kanban Board
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track research projects through their lifecycle stages
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshData()}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>
              <Button size="sm" onClick={handleCreateProject}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {viewModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                      'flex items-center gap-1.5',
                      viewMode === mode.id
                        ? 'bg-white dark:bg-gray-900 text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Filters */}
            <KanbanFilters />

            {/* Settings */}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Legend */}
        <div className="px-6 pb-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Legend:</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Planning</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>IRB Review</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Published</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        {error && (
          <div className="m-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        ) : (
          <ProjectKanbanBoard viewMode={viewMode} />
        )}
      </div>
    </div>
  );
}