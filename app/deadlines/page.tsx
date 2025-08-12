'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarDays, BarChart3, Plus, Filter, AlertCircle, Search, Clock } from 'lucide-react';
import { CalendarView } from '@/components/deadlines/calendar-view';
import { TimelineView } from '@/components/deadlines/timeline-view';
import { DeadlineCreationForm } from '@/components/deadlines/deadline-creation-form';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLab } from '@/lib/contexts/lab-context';
import { 
  useDeadlines, 
  useCreateDeadline, 
  useUpdateDeadline, 
  useDeleteDeadline,
  useStudies,
  useTeamMembers 
} from '@/hooks/use-api';
import { debounce } from 'lodash';
import type { DeadlineFilters } from '@/types/deadline';

export default function DeadlinesPage() {
  const { currentLab, isLoading: labLoading } = useLab();
  
  // State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'calendar' | 'timeline'>('calendar');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deadlineToDelete, setDeadlineToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeadlineFilters>({
    type: undefined,
    priority: undefined,
    assigneeId: undefined,
    projectId: undefined,
    upcoming: true,
  });

  // React Query hooks
  const { 
    data: deadlines = [], 
    isLoading: deadlinesLoading, 
    error: deadlinesError,
    refetch: refetchDeadlines 
  } = useDeadlines(currentLab?.id, filters);
  
  const { data: studies = [] } = useStudies(currentLab?.id);
  const { data: teamMembers = [] } = useTeamMembers(currentLab?.id);
  
  const createMutation = useCreateDeadline();
  const updateMutation = useUpdateDeadline();
  const deleteMutation = useDeleteDeadline();

  // Metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const upcoming = deadlines.filter(d => new Date(d.dueDate) >= today).length;
    const overdue = deadlines.filter(d => 
      new Date(d.dueDate) < today && d.status !== 'COMPLETED'
    ).length;
    const thisWeek = deadlines.filter(d => {
      const dueDate = new Date(d.dueDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);
      return dueDate >= today && dueDate <= weekFromNow;
    }).length;
    const completed = deadlines.filter(d => d.status === 'COMPLETED').length;

    return { upcoming, overdue, thisWeek, completed };
  }, [deadlines]);

  // Handlers
  const handleCreateDeadline = useCallback(async (data: any) => {
    if (!currentLab?.id) {
      toast.error('No lab selected');
      return;
    }
    
    try {
      await createMutation.mutateAsync({
        ...data,
        labId: currentLab.id,
      });
      setShowCreateForm(false);
      toast.success('Deadline created successfully');
    } catch (error) {
      console.error('Failed to create deadline:', error);
    }
  }, [currentLab?.id, createMutation]);

  const handleUpdateDeadline = useCallback(async (id: string, data: any) => {
    try {
      await updateMutation.mutateAsync({ id, ...data });
      toast.success('Deadline updated successfully');
    } catch (error) {
      console.error('Failed to update deadline:', error);
    }
  }, [updateMutation]);

  const handleDeleteDeadline = useCallback((id: string) => {
    setDeadlineToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteDeadline = useCallback(async () => {
    if (!deadlineToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(deadlineToDelete);
      toast.success('Deadline deleted successfully');
      setDeadlineToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete deadline:', error);
      toast.error('Failed to delete deadline');
    }
  }, [deadlineToDelete, deleteMutation]);

  // Loading state
  if (labLoading || deadlinesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse">Loading deadlines...</div>
      </div>
    );
  }

  // Error state
  if (deadlinesError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load deadlines</span>
            <Button onClick={() => refetchDeadlines()} size="sm" variant="outline" className="ml-4">
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
              <h1 className="text-3xl font-bold">Deadlines</h1>
              <p className="text-muted-foreground">
                Track important dates and milestones across your research
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Deadline
            </Button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal">Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.upcoming}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metrics.thisWeek}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.overdue}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.completed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                type: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="IRB_RENEWAL">IRB Renewal</SelectItem>
                <SelectItem value="GRANT_SUBMISSION">Grant Submission</SelectItem>
                <SelectItem value="PAPER_DEADLINE">Paper Deadline</SelectItem>
                <SelectItem value="CONFERENCE_ABSTRACT">Conference Abstract</SelectItem>
                <SelectItem value="MILESTONE">Milestone</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
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
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.assigneeId}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                assigneeId: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.projectId}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                projectId: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {studies.map(study => (
                  <SelectItem key={study.id} value={study.id}>
                    {study.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'calendar' | 'timeline')} className="flex-1">
        <TabsList className="mx-6 mt-4">
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Timeline View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="flex-1 p-6">
          <CalendarView 
            deadlines={deadlines}
            onDeadlineSelect={(id) => setSelectedDeadline(id)}
            onDeadlineDelete={handleDeleteDeadline}
            onDeadlineUpdate={handleUpdateDeadline}
          />
        </TabsContent>

        <TabsContent value="timeline" className="flex-1 p-6">
          <TimelineView 
            deadlines={deadlines}
            onDeadlineSelect={(id) => setSelectedDeadline(id)}
            onDeadlineDelete={handleDeleteDeadline}
            onDeadlineUpdate={handleUpdateDeadline}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showCreateForm && (
        <DeadlineCreationForm
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateDeadline}
          projects={studies}
          teamMembers={teamMembers}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteDeadline}
        itemName={deadlines.find(d => d.id === deadlineToDelete)?.title}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}