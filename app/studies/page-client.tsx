'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLab } from '@/lib/contexts/lab-context';
import { StudiesPageSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Search, Filter, Download, Upload, Grid3x3, List } from 'lucide-react';
import { 
  useStudies, 
  useCreateStudy, 
  useUpdateStudy, 
  useDeleteStudy,
  useBuckets,
  useTeamMembers 
} from '@/hooks/use-api';
import { debounce } from 'lodash';
import type { StudyFilters, CreateStudyPayload, UpdateStudyPayload } from '@/types/study';
import { StudyCard } from '@/components/studies/study-card';
import { StudyTable } from '@/components/studies/study-table';
import { CreateStudyDialog } from '@/components/studies/create-study-dialog';
import { StudyDetailsDialog } from '@/components/studies/study-details-dialog';
import { BulkActionsBar } from '@/components/studies/bulk-actions-bar';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

type ViewMode = 'grid' | 'table' | 'kanban';

export default function StudiesPageClient() {
  const { currentLab, isLoading: labLoading } = useLab();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<StudyFilters>({
    searchTerm: '',
    status: undefined,
    priority: undefined,
    bucketId: undefined,
    assigneeId: undefined,
  });
  const [selectedStudies, setSelectedStudies] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // React Query hooks
  const { 
    data: studies = [], 
    isLoading: studiesLoading, 
    error: studiesError,
    refetch: refetchStudies 
  } = useStudies(currentLab?.id, filters);
  
  const { data: buckets = [] } = useBuckets(currentLab?.id);
  const { data: teamMembers = [] } = useTeamMembers(currentLab?.id);
  
  const createMutation = useCreateStudy();
  const updateMutation = useUpdateStudy();
  const deleteMutation = useDeleteStudy();

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setFilters(prev => ({ ...prev, searchTerm: value }));
    }, 300),
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ to focus search
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl+N to create new study
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCreateDialogOpen(true);
      }
      // Escape to clear selection
      if (e.key === 'Escape' && selectedStudies.size > 0) {
        setSelectedStudies(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudies.size]);

  // Handlers
  const handleCreateStudy = useCallback(async (data: CreateStudyPayload) => {
    if (!currentLab?.id) {
      toast.error('No lab selected');
      return;
    }
    
    try {
      await createMutation.mutateAsync({
        ...data,
        labId: currentLab.id,
      });
      setCreateDialogOpen(false);
      toast.success('Study created successfully');
    } catch (error) {
      console.error('Failed to create study:', error);
    }
  }, [currentLab?.id, createMutation]);

  const handleUpdateStudy = useCallback(async (id: string, data: UpdateStudyPayload) => {
    try {
      await updateMutation.mutateAsync({ id, ...data });
      toast.success('Study updated successfully');
    } catch (error) {
      console.error('Failed to update study:', error);
    }
  }, [updateMutation]);

  const handleDeleteStudy = useCallback((id: string) => {
    setStudyToDelete(id);
    setDeleteDialogOpen(true);
  }, []);
  
  const confirmDeleteStudy = useCallback(async () => {
    if (!studyToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(studyToDelete);
      toast.success('Study deleted successfully');
      setSelectedStudy(null);
      setStudyToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete study:', error);
      toast.error('Failed to delete study');
    }
  }, [studyToDelete, deleteMutation]);

  const handleBulkDelete = useCallback(() => {
    setBulkDeleteDialogOpen(true);
  }, []);
  
  const confirmBulkDelete = useCallback(async () => {
    try {
      await Promise.all(
        Array.from(selectedStudies).map(id => deleteMutation.mutateAsync(id))
      );
      toast.success(`${selectedStudies.size} studies deleted successfully`);
      setSelectedStudies(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete studies:', error);
      toast.error('Failed to delete studies');
    }
  }, [selectedStudies, deleteMutation]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(studies, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `studies-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [studies]);

  // Loading state
  if (labLoading || studiesLoading) {
    return <StudiesPageSkeleton />;
  }

  // Error state
  if (studiesError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load studies</span>
            <Button onClick={() => refetchStudies()} size="sm" variant="outline" className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No lab selected
  if (!currentLab) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No lab selected</h2>
          <p className="mt-2 text-muted-foreground">
            Please select a lab from the top navigation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Studies</h1>
              <p className="text-muted-foreground">
                Manage research studies for {currentLab.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Study
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search studies... (Ctrl+/)"
                className="pl-9"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                status: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                priority: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.bucketId}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                bucketId: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Buckets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buckets</SelectItem>
                {buckets.map(bucket => (
                  <SelectItem key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedStudies.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedStudies.size}
          onClearSelection={() => setSelectedStudies(new Set())}
          onDelete={handleBulkDelete}
          onExport={handleExport}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {studies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Grid3x3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No studies found</h3>
            <p className="text-muted-foreground mb-4">
              {filters.searchTerm || filters.status || filters.priority || filters.bucketId
                ? 'Try adjusting your filters'
                : 'Get started by creating your first study'}
            </p>
            {!filters.searchTerm && !filters.status && !filters.priority && !filters.bucketId && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Study
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {studies.map(study => (
              <StudyCard
                key={study.id}
                study={study}
                isSelected={selectedStudies.has(study.id)}
                onSelect={(selected) => {
                  const newSelection = new Set(selectedStudies);
                  if (selected) {
                    newSelection.add(study.id);
                  } else {
                    newSelection.delete(study.id);
                  }
                  setSelectedStudies(newSelection);
                }}
                onClick={() => setSelectedStudy(study.id)}
              />
            ))}
          </div>
        ) : (
          <StudyTable
            studies={studies}
            selectedStudies={selectedStudies}
            onSelectionChange={setSelectedStudies}
            onStudyClick={setSelectedStudy}
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateStudyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateStudy}
        buckets={buckets}
        teamMembers={teamMembers}
      />
      
      {selectedStudy && (
        <StudyDetailsDialog
          studyId={selectedStudy}
          open={!!selectedStudy}
          onOpenChange={(open) => !open && setSelectedStudy(null)}
          onUpdate={handleUpdateStudy}
          onDelete={handleDeleteStudy}
        />
      )}
      
      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteStudy}
        itemName={studies.find(s => s.id === studyToDelete)?.name}
        isDeleting={deleteMutation.isPending}
      />
      
      <DeleteConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Studies?"
        description={`Are you sure you want to delete ${selectedStudies.size} studies? This action cannot be undone.`}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}