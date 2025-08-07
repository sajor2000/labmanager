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
import { StudyCard } from "./study-card";
import { StudyCreationForm } from "./study-creation-form";
import { BucketCreationForm } from "./bucket-creation-form";
import type { StudyCreationInput } from "@/lib/validations/study";
import { useStudyStore } from "@/lib/store/study-store";
import type { Study, Bucket } from "@/types";
import { useServerAction } from "@/hooks/use-server-action";
import { moveStudyToBucket as moveStudyToBucketAction, createStudy as createStudyAction } from "@/app/actions/study-actions";

interface Props {
  initialBuckets: any[];
  initialStudies: any[];
}

export function StackedBucketBoardClient({ initialBuckets, initialStudies }: Props) {
  const { studies, buckets, addStudy, setBuckets, setStudies } = useStudyStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [showBucketForm, setShowBucketForm] = useState(false);
  
  const { execute: executeMoveStudy } = useServerAction(moveStudyToBucketAction, {
    successMessage: 'Study moved successfully',
  });
  
  const { execute: executeCreateStudy } = useServerAction(createStudyAction, {
    successMessage: 'Study created successfully',
  });
  
  // Initialize store with real data from database on first load
  useEffect(() => {
    if (buckets.length === 0 && initialBuckets.length > 0) {
      // Transform database buckets to store format
      const transformedBuckets: Bucket[] = initialBuckets.map(b => ({
        id: b.id,
        title: b.name || b.title,
        color: b.color,
        studyIds: b.projects?.map((s: any) => s.id) || b.studies?.map((s: any) => s.id) || [],
        labId: b.labId,
        order: b.position ?? b.order,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
        description: b.description || ''
      }));
      setBuckets(transformedBuckets);
    }
    
    if (studies.length === 0 && initialStudies.length > 0) {
      // Transform database studies to store format
      const transformedStudies: Study[] = initialStudies.map(s => ({
        id: s.id,
        title: s.name || s.title,
        oraNumber: s.oraNumber,
        status: s.status as Study['status'],
        priority: s.priority as Study['priority'],
        studyType: s.projectType || s.studyType,
        bucketId: s.bucketId,
        fundingSource: s.fundingSource as Study['fundingSource'],
        fundingDetails: s.fundingDetails,
        assigneeIds: s.members?.map((a: any) => a.userId) || s.assignees?.map((a: any) => a.userId) || [],
        externalCollaborators: s.externalCollaborators,
        dueDate: s.dueDate ? new Date(s.dueDate) : undefined,
        notes: s.notes,
        progress: s.progress || 0,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        createdById: s.createdById,
        labId: s.labId
      }));
      setStudies(transformedStudies);
    }
  }, [initialBuckets, initialStudies, buckets.length, studies.length, setBuckets, setStudies]);
  
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
          assignees: study.assigneeIds || [],
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

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
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

    const activeStudy = studies.find(s => s.id === activeId);
    const originalBucketId = activeStudy?.bucketId;

    // Move study to new bucket using Server Action for persistence
    if (destBucketId && originalBucketId && destBucketId !== originalBucketId) {
      // Optimistically update UI
      setStudies(studies.map(s => 
        s.id === activeId ? { ...s, bucketId: destBucketId } : s
      ));
      
      try {
        // Persist to database - will throw on error
        await executeMoveStudy({ studyId: activeId, bucketId: destBucketId });
      } catch (error) {
        // Revert optimistic update on error
        setStudies(studies.map(s => 
          s.id === activeId ? { ...s, bucketId: originalBucketId || s.bucketId } : s
        ));
        
        console.error('Error moving study:', error);
        // Toast is already shown by useServerAction hook
      }
    }

    setActiveId(null);
  }, [buckets, studies, setStudies, executeMoveStudy]);

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
        assignees: study.assigneeIds || [],
        funding: study.fundingSource || '',
        collaborators: study.externalCollaborators || '',
        bucketColor: bucket?.color || '#00BCD4'
      };
    }
    return null;
  }, [activeId, studies, buckets]);

  const handleCreateStudy = useCallback(async (data: StudyCreationInput) => {
    // Find the target bucket
    const targetBucket = selectedBucketId 
      ? buckets.find(b => b.id === selectedBucketId)
      : data.bucket 
        ? buckets.find(b => b.title === data.bucket)
        : buckets[0];
    
    if (!targetBucket) {
      console.error('No bucket found for study creation');
      return;
    }
    
    try {
      // Get current user and lab info
      const userResponse = await fetch('/api/users/current');
      const currentUser = await userResponse.json();
      
      if (!currentUser || !currentUser.id) {
        throw new Error('User not authenticated');
      }
      
      // Prepare data for server action
      const studyData = {
        title: data.studyName,
        oraNumber: data.oraNumber || undefined,
        status: data.status,
        priority: data.priority,
        studyType: data.studyType || "Unspecified",
        bucketId: targetBucket.id,
        labId: targetBucket.labId,
        fundingSource: data.fundingSource as Study['fundingSource'] || undefined,
        fundingDetails: undefined,
        externalCollaborators: data.externalCollaborators || undefined,
        dueDate: data.dueDate || undefined,
        notes: data.notes || undefined,
        createdById: currentUser.id,
        assigneeIds: [],
      };
      
      // Call server action to create study in database
      const result = await executeCreateStudy(studyData);
      
      if (result?.success && result.data) {
        // Transform the returned project to Study format for the store
        const newStudy: Study = {
          id: result.data.id,
          title: result.data.name,
          oraNumber: result.data.oraNumber || undefined,
          status: result.data.status as Study['status'],
          priority: result.data.priority as Study['priority'],
          studyType: result.data.projectType || result.data.studyType || "Unspecified",
          bucketId: result.data.bucketId,
          fundingSource: result.data.fundingSource as Study['fundingSource'] || undefined,
          fundingDetails: result.data.fundingDetails || undefined,
          assigneeIds: result.data.members?.map((m: any) => m.userId) || [],
          externalCollaborators: result.data.externalCollaborators || undefined,
          dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
          notes: result.data.notes || undefined,
          progress: result.data.progress || 0,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
          createdById: result.data.createdById,
          labId: result.data.labId
        };
        
        // Add to local store for immediate UI update
        addStudy(newStudy);
      }
    } catch (error) {
      console.error('Error creating study:', error);
      // Error toast is already shown by useServerAction hook
    }
    
    setSelectedBucketId(null);
  }, [selectedBucketId, buckets, addStudy, executeCreateStudy]);
  
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