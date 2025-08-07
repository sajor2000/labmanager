'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskCard } from '@/components/tasks/task-card';
import { TaskColumn } from '@/components/tasks/task-column';
import { TaskCreationForm } from '@/components/tasks/task-creation-form';
import { useTaskStore } from '@/lib/store/task-store';
import type { Task, TaskStatus } from '@/types';
import { showToast } from '@/components/ui/toast';

const TASK_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'REVIEW', title: 'Review', color: 'bg-yellow-500' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-green-500' },
  { id: 'BLOCKED', title: 'Blocked', color: 'bg-red-500' },
];

export function TaskBoard() {
  const { tasks, updateTaskStatus, setLoading, setTasks } = useTaskStore();
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>({
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    COMPLETED: [],
    BLOCKED: [],
  });
  const [isMounted, setIsMounted] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('TODO');
  
  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tasks');
        if (response.ok) {
          const backendTasks = await response.json();
          
          // Transform backend tasks to frontend Task format with assignee details
          const transformedTasks: Task[] = backendTasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            studyId: t.projectId, // Map projectId to studyId for frontend
            projectId: t.projectId,
            assigneeIds: t.assignees?.map((a: any) => a.userId) || [],
            assignees: t.assignees || [], // Keep full assignee data for display
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
            startDate: t.startDate ? new Date(t.startDate) : undefined,
            estimatedHours: t.estimatedHours,
            actualHours: t.actualHours,
            tags: t.tags || [],
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            createdById: t.createdById,
          }));
          
          setTasks(transformedTasks);
        }
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Failed to load tasks',
          message: error instanceof Error ? error.message : 'Please try refreshing the page',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [setLoading, setTasks]);

  // Group tasks by status
  useEffect(() => {
    const grouped = tasks.reduce((acc, task) => {
      const status = task.status || 'TODO';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);

    // Ensure all columns exist
    TASK_COLUMNS.forEach(col => {
      if (!grouped[col.id]) {
        grouped[col.id] = [];
      }
    });

    setColumns(grouped);
  }, [tasks]);

  // Prevent hydration issues with drag and drop
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside of droppable area
    if (!destination) return;

    // No change in position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    // Optimistic update
    const newColumns = { ...columns };
    const sourceColumn = [...newColumns[sourceStatus]];
    const destColumn = sourceStatus === destStatus 
      ? sourceColumn 
      : [...newColumns[destStatus]];

    // Remove from source
    const [removed] = sourceColumn.splice(source.index, 1);
    
    // Add to destination
    if (sourceStatus === destStatus) {
      sourceColumn.splice(destination.index, 0, removed);
      newColumns[sourceStatus] = sourceColumn;
    } else {
      destColumn.splice(destination.index, 0, removed);
      newColumns[sourceStatus] = sourceColumn;
      newColumns[destStatus] = destColumn;
    }

    setColumns(newColumns);

    // Update task status if column changed
    if (sourceStatus !== destStatus) {
      try {
        await updateTaskStatus(draggableId, destStatus);
        showToast({
          type: 'success',
          title: 'Task updated',
          message: `Task moved to ${TASK_COLUMNS.find(c => c.id === destStatus)?.title}`,
        });
      } catch (error) {
        // Revert on error
        setColumns(columns);
        showToast({
          type: 'error',
          title: 'Failed to update task',
          message: 'Please try again',
        });
      }
    }
  };

  if (!isMounted) {
    return (
      <div className="flex gap-6 p-6 overflow-x-auto">
        {TASK_COLUMNS.map((column) => (
          <TaskColumn
            key={column.id}
            title={column.title}
            color={column.color}
            count={0}
          >
            <div className="space-y-3">
              {/* Placeholder cards */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          </TaskColumn>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 p-6 overflow-x-auto h-full">
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
                  setShowTaskForm(true);
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
      
      {/* Task Creation Form Modal */}
      <TaskCreationForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        defaultStatus={defaultStatus}
      />
    </DragDropContext>
  );
}