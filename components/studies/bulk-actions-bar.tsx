'use client';

import { Button } from '@/components/ui/button';
import { X, Trash2, Download } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onExport: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onExport,
}: BulkActionsBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-muted/50 border-b">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
        >
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}