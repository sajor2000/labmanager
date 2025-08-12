'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useLab } from '@/lib/contexts/lab-context';
import { TasksPageSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Search, Filter, CheckSquare, Clock, Users } from 'lucide-react';
import { 
  useTasks, 
  useCreateTask, 
  useUpdateTask, 
  useDeleteTask,
  useCompleteTask,
  useStudies,
  useTeamMembers 
} from '@/hooks/use-api';
import { debounce } from 'lodash';
import type { TaskFilters, CreateTaskPayload, UpdateTaskPayload, TaskStatus } from '@/types/task';
import { TaskCard } from '@/components/tasks/task-card';
import { TaskColumn } from '@/components/tasks/task-column';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

const TASK_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', title: 'Review', color: 'bg-yellow-500' },
  { id: 'completed', title: 'Completed', color: 'bg-green-500' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-500' },
];

export default function TasksPage() {
  const { currentLab, isLoading: labLoading } = useLab();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [filters, setFilters] = useState<TaskFilters>({
    searchTerm: '',
    status: undefined,
    priority: undefined,
    assigneeId: undefined,
    studyId: undefined,
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');
  const [isMounted, setIsMounted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // React Query hooks
  const { 
    data: tasks = [], 
    isLoading: tasksLoading, 
    error: tasksError,
    refetch: refetchTasks 
  } = useTasks(currentLab?.id, filters);
  
  const { data: studies = [] } = useStudies(currentLab?.id);
  const { data: teamMembers = [] } = useTeamMembers(currentLab?.id);
  
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const completeMutation = useCompleteTask();

  // Group tasks by status
  const columns = useMemo(() => {
    const grouped = tasks.reduce((acc, task) => {
      const status = task.status || 'todo';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    }, {} as Record<TaskStatus, typeof tasks>);

    // Ensure all columns exist
    TASK_COLUMNS.forEach(col => {
      if (!grouped[col.id]) {
        grouped[col.id] = [];
      }
    });

    return grouped;
  }, [tasks]);

  // Task metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const overdue = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;

    return { total, completed, inProgress, overdue };
  }, [tasks]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setFilters(prev => ({ ...prev, searchTerm: value }));
    }, 300),
    []
  );

  // Prevent hydration issues with drag and drop
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCreateDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleCreateTask = useCallback(async (data: CreateTaskPayload) => {
    if (!currentLab?.id) {
      toast.error('No lab selected');
      return;
    }
    
    try {
      await createMutation.mutateAsync(data);
      setCreateDialogOpen(false);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }, [currentLab?.id, createMutation]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const destStatus = destination.droppableId as TaskStatus;
    const task = tasks.find(t => t.id === draggableId);
    
    if (!task || task.status === destStatus) return;

    try {
      await updateMutation.mutateAsync({
        id: draggableId,
        status: destStatus,
      });
      toast.success(`Task moved to ${TASK_COLUMNS.find(c => c.id === destStatus)?.title}`);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }, [tasks, updateMutation]);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      await completeMutation.mutateAsync(taskId);
      toast.success('Task marked as completed');
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  }, [completeMutation]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  }, []);
  
  const confirmDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(taskToDelete);
      toast.success('Task deleted successfully');
      setTaskToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  }, [taskToDelete, deleteMutation]);

  // Loading state
  if (labLoading || tasksLoading) {
    return <TasksPageSkeleton />;
  }

  // Error state
  if (tasksError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load tasks</span>
            <Button onClick={() => refetchTasks()} size="sm" variant="outline" className="ml-4">
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
              <h1 className="text-3xl font-bold">Task Board</h1>
              <p className="text-muted-foreground">
                Track and manage tasks across all research projects
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metrics.inProgress}</div>
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.overdue}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search tasks... (Ctrl+/)"
                className="pl-9"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            
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
                <SelectItem value="urgent">Urgent</SelectItem>
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
              value={filters.studyId}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                studyId: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Studies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Studies</SelectItem>
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

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        {!isMounted ? (
          <div className="flex gap-6 p-6">
            {TASK_COLUMNS.map((column) => (
              <TaskColumn
                key={column.id}
                title={column.title}
                color={column.color}
                count={0}
              >
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 rounded-lg bg-muted animate-pulse"
                    />
                  ))}
                </div>
              </TaskColumn>
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 p-6 h-full">
              {TASK_COLUMNS.map((column) => (
                <Droppable key={column.id} droppableId={column.id}>
                  {(provided, snapshot) => (
                    <TaskColumn
                      title={column.title}
                      color={column.color}
                      count={columns[column.id]?.length || 0}
                      isDraggingOver={snapshot.isDraggingOver}
                      onAddClick={() => {
                        setDefaultStatus(column.id);
                        setCreateDialogOpen(true);
                      }}
                    >
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-3 min-h-[200px]"
                      >
                        {columns[column.id]?.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                              >
                                <TaskCard
                                  task={task}
                                  isDragging={snapshot.isDragging}
                                  onComplete={() => handleCompleteTask(task.id)}
                                  onDelete={() => handleDeleteTask(task.id)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </TaskColumn>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateTask}
        defaultStatus={defaultStatus}
        studies={studies}
        teamMembers={teamMembers}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteTask}
        itemName={tasks.find(t => t.id === taskToDelete)?.title}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}