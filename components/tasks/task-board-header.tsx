'use client';

import { useState } from 'react';
import { Plus, Filter, Search, Download, Calendar, Users } from 'lucide-react';
import { TaskCreationForm } from '@/components/tasks/task-creation-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useTaskStore } from '@/lib/store/task-store';
import { format } from 'date-fns';

export function TaskBoardHeader() {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priority: [] as string[],
    assignee: [] as string[],
    project: [] as string[],
  });
  const { tasks } = useTaskStore();

  // Export tasks to CSV
  const handleExportTasks = async () => {
    const exportData = tasks.map(task => ({
      Title: task.title,
      Description: task.description || '',
      Status: task.status,
      Priority: task.priority,
      'Due Date': task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      'Created At': format(new Date(task.createdAt), 'yyyy-MM-dd'),
    }));

    const csv = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="border-b dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left side - Search and Filters */}
          <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {(filters.priority.length > 0 || 
                    filters.assignee.length > 0 || 
                    filters.project.length > 0) && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                      {filters.priority.length + filters.assignee.length + filters.project.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filters.priority.includes('CRITICAL')}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      priority: checked 
                        ? [...prev.priority, 'CRITICAL']
                        : prev.priority.filter(p => p !== 'CRITICAL')
                    }));
                  }}
                >
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    Critical
                  </span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.priority.includes('HIGH')}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      priority: checked 
                        ? [...prev.priority, 'HIGH']
                        : prev.priority.filter(p => p !== 'HIGH')
                    }));
                  }}
                >
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                    High
                  </span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.priority.includes('MEDIUM')}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      priority: checked 
                        ? [...prev.priority, 'MEDIUM']
                        : prev.priority.filter(p => p !== 'MEDIUM')
                    }));
                  }}
                >
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                    Medium
                  </span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.priority.includes('LOW')}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      priority: checked 
                        ? [...prev.priority, 'LOW']
                        : prev.priority.filter(p => p !== 'LOW')
                    }));
                  }}
                >
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
                    Low
                  </span>
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
                
                {filters.priority.length > 0 || filters.assignee.length > 0 || filters.project.length > 0 ? (
                  <DropdownMenuItem
                    onClick={() => setFilters({ priority: [], assignee: [], project: [] })}
                    className="text-red-600 dark:text-red-400"
                  >
                    Clear all filters
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* View Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Calendar className="h-4 w-4 mr-2" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar View
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  By Assignee
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Button */}
            <LoadingButton
              variant="outline"
              size="sm"
              className="h-9"
              onAsyncClick={handleExportTasks}
              loadingText="Exporting..."
              successMessage="Tasks exported successfully"
              errorMessage="Failed to export tasks"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </LoadingButton>

            {/* Create Task Button */}
            <Button 
              size="sm" 
              className="h-9"
              onClick={() => setShowTaskForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Task Creation Form Modal */}
      <TaskCreationForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
      />
    </>
  );
}