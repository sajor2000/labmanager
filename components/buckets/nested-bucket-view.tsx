'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BucketCard, type Bucket } from './bucket-card';
import { showToast } from '@/components/ui/toast';

interface NestedBucketViewProps {
  buckets: Bucket[];
  onEdit: (bucket: Bucket) => void;
  onArchive: (bucketId: string) => void;
  onDelete: (bucketId: string) => void;
  onViewProjects: (bucketId: string) => void;
  onCreateSubBucket: (parentId: string) => void;
  onToggleExpand: (bucketId: string) => void;
  onConfigureRules?: (bucket: Bucket) => void;
  selectionMode?: boolean;
  selectedBuckets?: Set<string>;
  onSelectionChange?: (bucketId: string, selected: boolean) => void;
}

export function NestedBucketView({
  buckets,
  onEdit,
  onArchive,
  onDelete,
  onViewProjects,
  onCreateSubBucket,
  onToggleExpand,
  onConfigureRules,
  selectionMode = false,
  selectedBuckets = new Set(),
  onSelectionChange,
}: NestedBucketViewProps) {
  // Build tree structure from flat list
  const buildTree = (items: Bucket[], parentId?: string, depth = 0): Bucket[] => {
    return items
      .filter(item => item.parentBucketId === parentId)
      .map(item => ({
        ...item,
        depth,
        childBuckets: buildTree(items, item.id, depth + 1),
      }))
      .sort((a, b) => a.position - b.position);
  };

  const rootBuckets = buildTree(buckets);

  const renderBucket = (bucket: Bucket) => {
    const hasChildren = bucket.childBuckets && bucket.childBuckets.length > 0;
    const isExpanded = bucket.isExpanded ?? true;

    return (
      <div key={bucket.id} className="w-full">
        <div 
          className={cn(
            "group relative mb-4",
            bucket.depth && bucket.depth > 0 && "ml-8"
          )}
        >
          <div className="flex items-start gap-2">
            {/* Expand/Collapse Button */}
            {hasChildren && (
              <button
                onClick={() => onToggleExpand(bucket.id)}
                className="mt-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
            
            {/* Indent for childless buckets */}
            {!hasChildren && bucket.depth === 0 && (
              <div className="w-6" />
            )}

            {/* Bucket Card */}
            <div className="flex-1">
              <BucketCard
                bucket={bucket}
                onEdit={() => onEdit(bucket)}
                onArchive={() => onArchive(bucket.id)}
                onDelete={() => onDelete(bucket.id)}
                onViewProjects={() => onViewProjects(bucket.id)}
                onConfigureRules={() => onConfigureRules?.(bucket)}
                selectionMode={selectionMode}
                isSelected={selectedBuckets.has(bucket.id)}
                onSelectionChange={(selected) => onSelectionChange?.(bucket.id, selected)}
              />
            </div>

            {/* Add Sub-bucket Button */}
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity mt-2"
              onClick={() => onCreateSubBucket(bucket.id)}
            >
              <Plus className="h-4 w-4" />
              Sub-bucket
            </Button>
          </div>

          {/* Connection Line */}
          {bucket.depth && bucket.depth > 0 && (
            <div 
              className="absolute left-[-16px] top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-700"
              style={{ 
                left: `${-28 - (bucket.depth - 1) * 32}px`,
                top: '-16px',
                height: 'calc(100% + 32px)'
              }}
            />
          )}
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-4">
            {bucket.childBuckets!.map(child => renderBucket(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      {rootBuckets.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No buckets created yet. Click "New Bucket" to get started.
          </p>
        </div>
      ) : (
        rootBuckets.map(bucket => renderBucket(bucket))
      )}
    </div>
  );
}