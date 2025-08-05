'use client';

import { Archive, Trash2, Palette, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { showToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface BulkActionToolbarProps {
  selectedCount: number;
  onArchive: () => void;
  onDelete: () => void;
  onChangeColor: () => void;
  onExport: () => void;
  onClearSelection: () => void;
  className?: string;
}

export function BulkActionToolbar({
  selectedCount,
  onArchive,
  onDelete,
  onChangeColor,
  onExport,
  onClearSelection,
  className,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;
  
  const handleArchive = () => {
    if (confirm(`Are you sure you want to archive ${selectedCount} bucket${selectedCount > 1 ? 's' : ''}?`)) {
      onArchive();
      showToast({
        type: 'success',
        title: 'Buckets archived',
        message: `${selectedCount} bucket${selectedCount > 1 ? 's have' : ' has'} been archived`,
      });
    }
  };
  
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedCount} bucket${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      onDelete();
      showToast({
        type: 'success',
        title: 'Buckets deleted',
        message: `${selectedCount} bucket${selectedCount > 1 ? 's have' : ' has'} been deleted`,
      });
    }
  };
  
  const handleExport = () => {
    onExport();
    showToast({
      type: 'success',
      title: 'Export started',
      message: 'Your bucket data is being prepared for download',
    });
  };
  
  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-4 flex items-center gap-4 z-50",
      className
    )}>
      {/* Selection Count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {selectedCount} selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleArchive}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              More Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={onChangeColor}>
              <Palette className="h-4 w-4 mr-2" />
              Change Color
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Buckets
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}