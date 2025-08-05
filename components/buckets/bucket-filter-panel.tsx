'use client';

import { useState } from 'react';
import { X, Filter, Calendar, Users, TrendingUp, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface BucketFilters {
  projectCountRange: [number, number];
  progressRange: [number, number];
  memberCountRange: [number, number];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  hasActiveRules: boolean | null;
  isActive: boolean | null;
  colors: string[];
  icons: string[];
}

interface BucketFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: BucketFilters;
  onFiltersChange: (filters: BucketFilters) => void;
  onReset: () => void;
}

const DEFAULT_FILTERS: BucketFilters = {
  projectCountRange: [0, 100],
  progressRange: [0, 100],
  memberCountRange: [0, 50],
  dateRange: {
    from: null,
    to: null,
  },
  hasActiveRules: null,
  isActive: null,
  colors: [],
  icons: [],
};

const AVAILABLE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#6B7280', // Gray
];

const AVAILABLE_ICONS = [
  { value: 'folder', label: 'Folder', icon: Folder },
  { value: 'trending', label: 'Trending', icon: TrendingUp },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'archive', label: 'Archive', icon: Folder },
];

export function BucketFilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onReset,
}: BucketFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<BucketFilters>(filters);
  
  if (!isOpen) return null;
  
  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };
  
  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onReset();
  };
  
  const activeFilterCount = () => {
    let count = 0;
    if (localFilters.projectCountRange[0] > 0 || localFilters.projectCountRange[1] < 100) count++;
    if (localFilters.progressRange[0] > 0 || localFilters.progressRange[1] < 100) count++;
    if (localFilters.memberCountRange[0] > 0 || localFilters.memberCountRange[1] < 50) count++;
    if (localFilters.dateRange.from || localFilters.dateRange.to) count++;
    if (localFilters.hasActiveRules !== null) count++;
    if (localFilters.isActive !== null) count++;
    if (localFilters.colors.length > 0) count++;
    if (localFilters.icons.length > 0) count++;
    return count;
  };
  
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </h2>
          {activeFilterCount() > 0 && (
            <Badge variant="secondary" className="mt-1">
              {activeFilterCount()} active
            </Badge>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Filters Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Project Count Range */}
        <div className="space-y-2">
          <Label>Project Count Range</Label>
          <div className="space-y-3">
            <Slider
              value={localFilters.projectCountRange}
              onValueChange={(value) => 
                setLocalFilters({ ...localFilters, projectCountRange: value as [number, number] })
              }
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{localFilters.projectCountRange[0]}</span>
              <span>{localFilters.projectCountRange[1]}</span>
            </div>
          </div>
        </div>
        
        {/* Progress Range */}
        <div className="space-y-2">
          <Label>Progress Range (%)</Label>
          <div className="space-y-3">
            <Slider
              value={localFilters.progressRange}
              onValueChange={(value) => 
                setLocalFilters({ ...localFilters, progressRange: value as [number, number] })
              }
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{localFilters.progressRange[0]}%</span>
              <span>{localFilters.progressRange[1]}%</span>
            </div>
          </div>
        </div>
        
        {/* Member Count Range */}
        <div className="space-y-2">
          <Label>Active Members Range</Label>
          <div className="space-y-3">
            <Slider
              value={localFilters.memberCountRange}
              onValueChange={(value) => 
                setLocalFilters({ ...localFilters, memberCountRange: value as [number, number] })
              }
              max={50}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{localFilters.memberCountRange[0]}</span>
              <span>{localFilters.memberCountRange[1]}</span>
            </div>
          </div>
        </div>
        
        {/* Date Range */}
        <div className="space-y-2">
          <Label>Created Date Range</Label>
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <Calendar className="h-4 w-4 mr-2" />
                  {localFilters.dateRange.from ? (
                    localFilters.dateRange.to ? (
                      <>
                        {format(localFilters.dateRange.from, 'MMM d, yyyy')} -{' '}
                        {format(localFilters.dateRange.to, 'MMM d, yyyy')}
                      </>
                    ) : (
                      format(localFilters.dateRange.from, 'MMM d, yyyy')
                    )
                  ) : (
                    'Select date range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={{
                    from: localFilters.dateRange.from || undefined,
                    to: localFilters.dateRange.to || undefined,
                  }}
                  onSelect={(range: any) => {
                    setLocalFilters({
                      ...localFilters,
                      dateRange: {
                        from: range?.from || null,
                        to: range?.to || null,
                      },
                    });
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Has Active Rules */}
        <div className="space-y-2">
          <Label>Automation Rules</Label>
          <Select
            value={
              localFilters.hasActiveRules === null 
                ? 'all' 
                : localFilters.hasActiveRules 
                ? 'yes' 
                : 'no'
            }
            onValueChange={(value) => {
              setLocalFilters({
                ...localFilters,
                hasActiveRules: value === 'all' ? null : value === 'yes',
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buckets</SelectItem>
              <SelectItem value="yes">With Active Rules</SelectItem>
              <SelectItem value="no">Without Rules</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={
              localFilters.isActive === null 
                ? 'all' 
                : localFilters.isActive 
                ? 'active' 
                : 'archived'
            }
            onValueChange={(value) => {
              setLocalFilters({
                ...localFilters,
                isActive: value === 'all' ? null : value === 'active',
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buckets</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="archived">Archived Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Colors */}
        <div className="space-y-2">
          <Label>Colors</Label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  const newColors = localFilters.colors.includes(color)
                    ? localFilters.colors.filter(c => c !== color)
                    : [...localFilters.colors, color];
                  setLocalFilters({ ...localFilters, colors: newColors });
                }}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  localFilters.colors.includes(color)
                    ? "border-gray-900 dark:border-white scale-110"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        
        {/* Icons */}
        <div className="space-y-2">
          <Label>Icons</Label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_ICONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  const newIcons = localFilters.icons.includes(value)
                    ? localFilters.icons.filter(i => i !== value)
                    : [...localFilters.icons, value];
                  setLocalFilters({ ...localFilters, icons: newIcons });
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                  localFilters.icons.includes(value)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-800">
        <Button variant="ghost" onClick={handleReset}>
          Reset All
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}