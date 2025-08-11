'use client';

import React, { useState } from 'react';
import { 
  X, Trash2, Archive, Tag, User, Calendar, 
  CheckSquare, Square, Copy, Move, Edit2,
  AlertCircle, Download, Upload, Mail, Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useViewContext } from '@/lib/contexts/view-context';
import type { Project, Bucket } from '@/types';

interface BulkActionsToolbarProps {
  selectedProjects: Project[];
  buckets: Bucket[];
  onUpdateProjects: (projectIds: string[], updates: Partial<Project>) => Promise<void>;
  onDeleteProjects: (projectIds: string[]) => Promise<void>;
  onMoveProjects: (projectIds: string[], bucketId: string) => Promise<void>;
  onDuplicateProjects: (projectIds: string[]) => Promise<void>;
  className?: string;
}

const STATUSES = [
  'PLANNING',
  'IRB_SUBMISSION',
  'IRB_APPROVED',
  'DATA_COLLECTION',
  'ANALYSIS',
  'MANUSCRIPT',
  'UNDER_REVIEW',
  'PUBLISHED',
  'ON_HOLD',
  'CANCELLED',
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function BulkActionsToolbar({
  selectedProjects,
  buckets,
  onUpdateProjects,
  onDeleteProjects,
  onMoveProjects,
  onDuplicateProjects,
  className,
}: BulkActionsToolbarProps) {
  const { clearSelection, selectAll } = useViewContext();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const selectedCount = selectedProjects.length;
  const selectedIds = selectedProjects.map(p => p.id);
  
  if (selectedCount === 0) return null;
  
  const handleBulkUpdate = async (updates: Partial<Project>) => {
    setIsProcessing(true);
    try {
      await onUpdateProjects(selectedIds, updates);
      clearSelection();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await onDeleteProjects(selectedIds);
      clearSelection();
      setShowDeleteDialog(false);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkMove = async (bucketId: string) => {
    setIsProcessing(true);
    try {
      await onMoveProjects(selectedIds, bucketId);
      clearSelection();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkDuplicate = async () => {
    setIsProcessing(true);
    try {
      await onDuplicateProjects(selectedIds);
      clearSelection();
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <>
      <div className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
        "bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700",
        "p-3 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200",
        className
      )}>
        {/* Selection Info */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-200 dark:border-gray-700">
          <Badge variant="secondary" className="font-semibold">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={clearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          {/* Status Update */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isProcessing}>
                <CheckSquare className="h-4 w-4 mr-1" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleBulkUpdate({ status: status as any })}
                >
                  {status.replace('_', ' ')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Priority Update */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isProcessing}>
                <AlertCircle className="h-4 w-4 mr-1" />
                Priority
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Set Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PRIORITIES.map((priority) => (
                <DropdownMenuItem
                  key={priority}
                  onClick={() => handleBulkUpdate({ priority: priority as any })}
                >
                  {priority}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Move to Bucket */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isProcessing}>
                <Move className="h-4 w-4 mr-1" />
                Move
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Move to Bucket</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {buckets.map((bucket) => (
                <DropdownMenuItem
                  key={bucket.id}
                  onClick={() => handleBulkMove(bucket.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: bucket.color }}
                    />
                    {bucket.title}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isProcessing}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {/* Open bulk edit modal */}}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit fields
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => {/* Add tags */}}>
                <Tag className="h-4 w-4 mr-2" />
                Add tags
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => {/* Assign users */}}>
                <User className="h-4 w-4 mr-2" />
                Assign to
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => {/* Set due date */}}>
                <Calendar className="h-4 w-4 mr-2" />
                Set due date
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleBulkDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => {/* Archive */}}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isProcessing}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {/* Export CSV */}}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* Export JSON */}}>
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* Export PDF */}}>
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {/* Email */}}>
                <Mail className="h-4 w-4 mr-2" />
                Email report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
        
        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Processing...</span>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} items?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. These projects will be permanently deleted
              from your workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : `Delete ${selectedCount} items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}