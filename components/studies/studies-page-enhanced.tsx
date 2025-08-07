'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { StudiesDataTable } from './studies-data-table';
import { KanbanBoard } from './kanban-board';
import { ViewSwitcher, ViewType } from './view-switcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StudyCreationModal } from '@/components/studies/study-creation-modal';
import { AdvancedFilter, FilterGroup } from '@/components/ui/advanced-filter';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Settings,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { showToast } from '@/components/ui/toast';

interface StudiesPageEnhancedProps {
  studies: any[];
  buckets: any[];
  users: any[];
  className?: string;
}

export function StudiesPageEnhanced({ 
  studies, 
  buckets, 
  users,
  className 
}: StudiesPageEnhancedProps) {
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterGroup | null>(null);
  const [savedFilters, setSavedFilters] = useState<FilterGroup[]>([]);

  // Filter studies based on search
  const filteredStudies = studies.filter(study => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      study.title?.toLowerCase().includes(query) ||
      study.oraNumber?.toLowerCase().includes(query) ||
      study.studyType?.toLowerCase().includes(query) ||
      study.status?.toLowerCase().includes(query)
    );
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    showToast({
      type: 'success',
      title: 'Data refreshed',
      message: 'Studies have been updated',
    });
  };

  const handleExport = () => {
    const data = filteredStudies.map(study => ({
      title: study.title,
      status: study.status,
      priority: study.priority,
      studyType: study.studyType,
      bucket: study.bucket?.title,
      assignees: study.assignees?.map((a: any) => a.user.name).join(', '),
      dueDate: study.dueDate,
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studies-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast({
      type: 'success',
      title: 'Export complete',
      message: `Exported ${data.length} studies`,
    });
  };

  const handleStudyUpdate = (studyId: string, updates: any) => {
    // Handle study updates
    console.log('Update study:', studyId, updates);
  };

  const handleStudyClick = (study: any) => {
    // Handle study click
    console.log('Study clicked:', study);
  };

  const handleCreateStudy = (status?: string) => {
    setShowCreateModal(true);
    // Can pre-populate status if creating from a specific column
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Research Studies
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage and track all research studies across your lab
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {filteredStudies.length} Active Studies
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              </Button>
              <Button 
                onClick={() => handleCreateStudy()}
                className="btn-modern gradient-primary text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Study
              </Button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search studies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              <AdvancedFilter
                fields={[
                  { id: 'status', label: 'Status', type: 'select', options: [
                    { value: 'planning', label: 'Planning' },
                    { value: 'irb-submission', label: 'IRB Submission' },
                    { value: 'irb-approved', label: 'IRB Approved' },
                    { value: 'data-collection', label: 'Data Collection' },
                    { value: 'analysis', label: 'Analysis' },
                    { value: 'manuscript', label: 'Manuscript' },
                    { value: 'under-review', label: 'Under Review' },
                    { value: 'published', label: 'Published' },
                  ]},
                  { id: 'priority', label: 'Priority', type: 'select', options: [
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'critical', label: 'Critical' },
                  ]},
                  { id: 'bucket', label: 'Bucket', type: 'select', options: 
                    buckets.map(b => ({ value: b.id, label: b.title }))
                  },
                  { id: 'studyType', label: 'Study Type', type: 'text' },
                  { id: 'progress', label: 'Progress', type: 'range' },
                  { id: 'dueDate', label: 'Due Date', type: 'date' },
                  { id: 'assignee', label: 'Assignee', type: 'select', options:
                    users.map(u => ({ value: u.id, label: u.name }))
                  },
                ]}
                onApply={(filters) => setActiveFilters(filters)}
                onReset={() => setActiveFilters(null)}
                savedFilters={savedFilters}
                onSaveFilter={(filter) => setSavedFilters([...savedFilters, filter])}
              />

              {/* View Switcher */}
              <ViewSwitcher
                currentView={currentView}
                onViewChange={setCurrentView}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Studies
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Studies
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    View Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
        {currentView === 'table' && (
          <div className="h-full overflow-auto">
            <StudiesDataTable 
              studies={filteredStudies}
              buckets={buckets}
              users={users}
            />
          </div>
        )}
        
        {currentView === 'kanban' && (
          <KanbanBoard
            studies={filteredStudies}
            onStudyUpdate={handleStudyUpdate}
            onStudyClick={handleStudyClick}
            onCreateStudy={handleCreateStudy}
            className="h-full"
          />
        )}
        
        {currentView === 'calendar' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Calendar View Coming Soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                View studies by their due dates and milestones
              </p>
            </div>
          </div>
        )}
        
        {currentView === 'timeline' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Timeline View Coming Soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Visualize study progress on a Gantt chart
              </p>
            </div>
          </div>
        )}
        
        {currentView === 'workload' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Workload View Coming Soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                See team capacity and study distribution
              </p>
            </div>
          </div>
        )}
        
        {currentView === 'analytics' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Analytics View Coming Soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Insights and metrics about your research studies
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Study Modal */}
      {showCreateModal && (
        <StudyCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateStudy={(study) => {
            // Handle study creation
            console.log('Creating study:', study);
            setShowCreateModal(false);
          }}
          users={users}
          buckets={buckets}
        />
      )}
    </div>
  );
}