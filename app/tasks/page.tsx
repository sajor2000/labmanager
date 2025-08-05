import { Suspense } from 'react';
import { TaskBoard } from '@/components/tasks/task-board';
import { TaskBoardHeader } from '@/components/tasks/task-board-header';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Task Board | LabManage',
  description: 'Manage and track all research tasks across projects',
};

// Loading skeleton for the task board
function TaskBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {[1, 2, 3, 4].map((col) => (
        <div key={col} className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3].map((card) => (
            <Skeleton key={card} className="h-32 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TasksPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="border-b dark:border-gray-800">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Task Board
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track and manage tasks across all your research projects
          </p>
        </div>
      </div>

      {/* Task Board Header with filters and actions */}
      <TaskBoardHeader />

      {/* Main Task Board */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<TaskBoardSkeleton />}>
          <TaskBoard />
        </Suspense>
      </div>
    </div>
  );
}