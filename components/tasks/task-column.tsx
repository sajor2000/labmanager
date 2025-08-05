'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TaskColumnProps {
  title: string;
  color: string;
  count: number;
  isDraggingOver?: boolean;
  children: React.ReactNode;
  onAddClick?: () => void;
}

export function TaskColumn({ 
  title, 
  color, 
  count, 
  isDraggingOver = false,
  children,
  onAddClick 
}: TaskColumnProps) {
  return (
    <div 
      className={cn(
        "flex flex-col bg-gray-50 dark:bg-gray-900 rounded-lg w-80 flex-shrink-0 transition-colors",
        isDraggingOver && "bg-blue-50 dark:bg-blue-950/20"
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", color)} />
            <h3 className="font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <span className="px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 rounded-full">
              {count}
            </span>
          </div>
          {onAddClick && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onAddClick}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}