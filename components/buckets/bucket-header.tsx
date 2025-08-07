'use client';

import { useState } from 'react';
import { Plus, Search, Filter, BarChart3, Grid, List, Archive, CheckSquare, FolderInput, Download, Upload, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface BucketHeaderProps {
  onCreateBucket: () => void;
  viewMode: 'grid' | 'list' | 'analytics';
  onViewModeChange: (mode: 'grid' | 'list' | 'analytics') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showArchived: boolean;
  onShowArchivedChange: (show: boolean) => void;
  selectionMode: boolean;
  onSelectionModeChange: (enabled: boolean) => void;
  selectedCount?: number;
  onImport?: () => void;
  onExport?: () => void;
  onAdvancedFilter?: () => void;
  hasActiveFilters?: boolean;
  currentLab?: string | null;
  availableLabs?: Array<{id: string, name: string, shortName: string}>;
  onLabChange?: (labId: string) => void;
}

export function BucketHeader({ 
  onCreateBucket, 
  viewMode, 
  onViewModeChange,
  searchQuery,
  onSearchChange,
  showArchived,
  onShowArchivedChange,
  selectionMode,
  onSelectionModeChange,
  selectedCount = 0,
  onImport,
  onExport,
  onAdvancedFilter,
  hasActiveFilters = false
}: BucketHeaderProps) {
  const [filters, setFilters] = useState({
    hasProjects: false,
    isEmpty: false,
    recentlyUpdated: false,
  });

  return (
    <div className="border-b dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left side - Search and Filters */}
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search buckets..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {(filters.hasProjects || filters.isEmpty || filters.recentlyUpdated || showArchived) && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                    {Object.values(filters).filter(v => v).length + (showArchived ? 1 : 0)}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
              
              <DropdownMenuCheckboxItem
                checked={filters.hasProjects}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({ ...prev, hasProjects: checked }));
                }}
              >
                Has Active Projects
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                checked={filters.isEmpty}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({ ...prev, isEmpty: checked }));
                }}
              >
                Empty Buckets
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                checked={filters.recentlyUpdated}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({ ...prev, recentlyUpdated: checked }));
                }}
              >
                Recently Updated
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuCheckboxItem
                checked={showArchived}
                onCheckedChange={onShowArchivedChange}
              >
                <Archive className="h-4 w-4 mr-2" />
                Show Archived
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              
              {(filters.hasProjects || filters.isEmpty || filters.recentlyUpdated || showArchived) && (
                <DropdownMenuItem
                  onClick={() => {
                    setFilters({ hasProjects: false, isEmpty: false, recentlyUpdated: false });
                    onShowArchivedChange(false);
                  }}
                  className="text-red-600 dark:text-red-400"
                >
                  Clear all filters
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side - View Options and Actions */}
        <div className="flex items-center gap-2">
          {/* Selection Mode Toggle */}
          {viewMode !== 'analytics' && (
            <Button
              variant={selectionMode ? 'default' : 'outline'}
              size="sm"
              className="h-9"
              onClick={() => onSelectionModeChange(!selectionMode)}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectionMode ? `${selectedCount} selected` : 'Select'}
            </Button>
          )}
          
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border dark:border-gray-700">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-8 px-2 rounded-r-none',
                viewMode === 'grid' ? '' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              onClick={() => onViewModeChange('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-8 px-2 rounded-none border-x dark:border-gray-700',
                viewMode === 'list' ? '' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'analytics' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-8 px-2 rounded-l-none',
                viewMode === 'analytics' ? '' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              onClick={() => onViewModeChange('analytics')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Advanced Filters Button */}
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            className="h-9"
            onClick={() => onAdvancedFilter?.()}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Advanced
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                Active
              </span>
            )}
          </Button>

          {/* Import/Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onImport?.()}>
                <Upload className="h-4 w-4 mr-2" />
                Import Buckets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.()}>
                <Download className="h-4 w-4 mr-2" />
                Export All Buckets
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/buckets/assign">
                  <FolderInput className="h-4 w-4 mr-2" />
                  Assign Projects
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Bucket Button */}
          <Button 
            size="sm" 
            className="h-9"
            onClick={onCreateBucket}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Bucket
          </Button>
        </div>
      </div>
    </div>
  );
}