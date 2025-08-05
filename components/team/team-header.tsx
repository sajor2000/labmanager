'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Users, Download, Grid, List, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

interface TeamHeaderProps {
  onAddMember: () => void;
  viewMode: 'grid' | 'list' | 'workload';
  onViewModeChange: (mode: 'grid' | 'list' | 'workload') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TeamHeader({ 
  onAddMember, 
  viewMode, 
  onViewModeChange,
  searchQuery,
  onSearchChange 
}: TeamHeaderProps) {
  const [filters, setFilters] = useState({
    roles: [] as string[],
    expertise: [] as string[],
    availability: 'all',
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
              placeholder="Search team members..."
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
                {(filters.roles.length > 0 || 
                  filters.expertise.length > 0 || 
                  filters.availability !== 'all') && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                    {filters.roles.length + filters.expertise.length + (filters.availability !== 'all' ? 1 : 0)}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.roles.includes('PRINCIPAL_INVESTIGATOR')}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    roles: checked 
                      ? [...prev.roles, 'PRINCIPAL_INVESTIGATOR']
                      : prev.roles.filter(r => r !== 'PRINCIPAL_INVESTIGATOR')
                  }));
                }}
              >
                Principal Investigator
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.roles.includes('RESEARCH_MEMBER')}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    roles: checked 
                      ? [...prev.roles, 'RESEARCH_MEMBER']
                      : prev.roles.filter(r => r !== 'RESEARCH_MEMBER')
                  }));
                }}
              >
                Research Member
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Availability</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, availability: 'available' }))}>
                Available (Under 60% capacity)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, availability: 'busy' }))}>
                Busy (60-80% capacity)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, availability: 'overloaded' }))}>
                Overloaded (Over 80% capacity)
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              {filters.roles.length > 0 || filters.expertise.length > 0 || filters.availability !== 'all' ? (
                <DropdownMenuItem
                  onClick={() => setFilters({ roles: [], expertise: [], availability: 'all' })}
                  className="text-red-600 dark:text-red-400"
                >
                  Clear all filters
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side - View Options and Actions */}
        <div className="flex items-center gap-2">
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
              variant={viewMode === 'workload' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-8 px-2 rounded-l-none',
                viewMode === 'workload' ? '' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              onClick={() => onViewModeChange('workload')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Export Button */}
          <Button variant="outline" size="sm" className="h-9">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Add Member Button */}
          <Button 
            size="sm" 
            className="h-9"
            onClick={onAddMember}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}