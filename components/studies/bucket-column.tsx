"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, MoreHorizontal } from "lucide-react";
import { SortableStudyCard } from "./sortable-study-card";
import { StudyData } from "./study-card";
import { cn } from "@/lib/utils";

interface BucketColumnProps {
  bucket: {
    id: string;
    title?: string;
    name?: string;
    color: string;
    studies: StudyData[];
  };
  studies: StudyData[];
  onAddStudy?: () => void;
}

export function BucketColumn({ bucket, onAddStudy }: BucketColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: bucket.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 transition-colors",
        isOver && "bg-gray-200 dark:bg-gray-700/50"
      )}
    >
      {/* Bucket Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: bucket.color }}
          />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {bucket.name || bucket.title}
          </h3>
          <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            {bucket.studies.length}
          </span>
        </div>
        <button className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700">
          <MoreHorizontal className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Studies List */}
      <SortableContext
        items={bucket.studies.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {bucket.studies.map((study) => (
            <SortableStudyCard key={study.id} study={study} />
          ))}
        </div>
      </SortableContext>

      {/* Add Study Button */}
      <button 
        onClick={onAddStudy}
        className="mt-3 flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 py-3 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300">
        <Plus className="mr-1 h-4 w-4" />
        Add Study
      </button>
    </div>
  );
}