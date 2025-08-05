"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus, Filter, ArrowUpDown, Palette, Share2, Settings2 } from "lucide-react";
import { BucketColumn } from "./bucket-column";
import { StudyCard, StudyData } from "./study-card";
import { StudyCreationForm } from "./study-creation-form";
import { BucketCreationForm } from "./bucket-creation-form";
import type { StudyCreationInput } from "@/lib/validations/study";
import { useStudyStore } from "@/lib/store/study-store";
import type { Study, Bucket } from "@/types";

// This component is now deprecated - use stacked-bucket-board-client.tsx instead
// Keeping for backward compatibility

export function StackedBucketBoard() {
  const { studies, buckets, addStudy, setBuckets, setStudies, moveStudyToBucket } = useStudyStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [showBucketForm, setShowBucketForm] = useState(false);
  
  // This component now expects data to be loaded from the store
  // Data should be fetched and initialized by the parent component
  
  // Transform store data to component format
  const bucketsWithStudies = useMemo(() => {
    return buckets.map(bucket => ({
      ...bucket,
      studies: studies
        .filter(study => study.bucketId === bucket.id)
        .map(study => ({
          id: study.id,
          title: study.title,
          status: study.status,
          studyType: study.studyType,
          assignees: [],
          funding: study.fundingSource || '',
          collaborators: study.externalCollaborators || '',
          bucketColor: bucket.color
        }))
    }));
  }, [buckets, studies]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the destination bucket
    let destBucketId = overId;
    if (!buckets.find(b => b.id === overId)) {
      // overId might be a study, find its bucket
      const study = studies.find(s => s.id === overId);
      if (study) {
        destBucketId = study.bucketId;
      }
    }

    // Move study to new bucket using store action
    if (destBucketId) {
      moveStudyToBucket(activeId, destBucketId);
    }

    setActiveId(null);
  }, [buckets, studies, moveStudyToBucket]);

  const getActiveStudy = useMemo(() => {
    if (!activeId) return null;
    const study = studies.find(s => s.id === activeId);
    if (study) {
      const bucket = buckets.find(b => b.id === study.bucketId);
      return {
        id: study.id,
        title: study.title,
        status: study.status,
        studyType: study.studyType,
        assignees: [],
        funding: study.fundingSource || '',
        collaborators: study.externalCollaborators || '',
        bucketColor: bucket?.color || '#00BCD4'
      };
    }
    return null;
  }, [activeId, studies, buckets]);

  const handleCreateStudy = useCallback((data: StudyCreationInput) => {
    // Find the target bucket
    const targetBucket = selectedBucketId 
      ? buckets.find(b => b.id === selectedBucketId)
      : data.bucket 
        ? buckets.find(b => b.title === data.bucket)
        : buckets[0];
    
    if (!targetBucket) return;
    
    const newStudy: Study = {
      id: Date.now().toString(),
      title: data.studyName,
      oraNumber: data.oraNumber || undefined,
      status: data.status,
      priority: data.priority,
      studyType: data.studyType || "Unspecified",
      bucketId: targetBucket.id,
      fundingSource: data.fundingSource as Study['fundingSource'] || undefined,
      assigneeIds: [],
      externalCollaborators: data.externalCollaborators || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      notes: data.notes || undefined,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'user1',
      labId: targetBucket.labId
    };

    addStudy(newStudy);
    setSelectedBucketId(null);
  }, [selectedBucketId, buckets, addStudy]);
  
  const handleAddStudyToBucket = useCallback((bucketId: string) => {
    setSelectedBucketId(bucketId);
    setShowCreateForm(true);
  }, []);

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b bg-white dark:bg-gray-950 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Stacked by Bucket
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Organize and track studies across different funding buckets
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                <Settings2 className="h-4 w-4" />
                <span>Customize cards</span>
              </button>
              <button className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
              <button className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort</span>
              </button>
              <button className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                <Palette className="h-4 w-4" />
                <span>Color</span>
              </button>
              <button className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                <Share2 className="h-4 w-4" />
                <span>Share view</span>
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>New Study</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto bg-gray-50 dark:bg-gray-900 p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex space-x-4 h-full">
              {bucketsWithStudies.map((bucket) => (
                <BucketColumn
                  key={bucket.id}
                  bucket={bucket}
                  studies={bucket.studies}
                  onAddStudy={() => handleAddStudyToBucket(bucket.id)}
                />
              ))}
              
              {/* Add Bucket Button */}
              <div className="flex-shrink-0">
                <button 
                  onClick={() => setShowBucketForm(true)}
                  className="flex h-full w-80 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white/50 hover:bg-white dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800">
                  <Plus className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Add Bucket
                  </span>
                </button>
              </div>
            </div>

            <DragOverlay>
              {activeId && getActiveStudy ? (
                <StudyCard study={getActiveStudy} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Study Creation Form */}
      <StudyCreationForm
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setSelectedBucketId(null);
        }}
        onSubmit={handleCreateStudy}
        defaultBucketId={selectedBucketId || undefined}
      />
      
      {/* Bucket Creation Form */}
      <BucketCreationForm
        isOpen={showBucketForm}
        onClose={() => setShowBucketForm(false)}
      />
    </>
  );
}