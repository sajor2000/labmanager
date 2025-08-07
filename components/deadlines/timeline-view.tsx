"use client";

import { useMemo } from "react";
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  FileText, 
  Users,
  ChevronRight
} from "lucide-react";
import { 
  format, 
  differenceInDays, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
  addMonths,
  subMonths
} from "date-fns";
import { cn } from "@/lib/utils";

interface Deadline {
  id: string;
  title: string;
  type: string;
  priority: string;
  dueDate: Date;
  dueTime?: string;
  projectId?: string;
  projectName?: string;
  assignees?: { id: string; name: string; initials: string }[];
  description?: string;
  status?: string;
}

interface TimelineViewProps {
  deadlines: Deadline[];
  projects: { id: string; name: string }[];
  onDeadlineClick?: (deadline: Deadline) => void;
  onCreateNew?: () => void;
}

const typeIcons: Record<string, any> = {
  IRB_RENEWAL: FileText,
  GRANT_SUBMISSION: FileText,
  PAPER_DEADLINE: FileText,
  MILESTONE: Clock,
  MEETING: Users,
  OTHER: Calendar,
};

const typeColors: Record<string, string> = {
  IRB_RENEWAL: "bg-blue-500",
  GRANT_SUBMISSION: "bg-green-500",
  PAPER_DEADLINE: "bg-purple-500",
  MILESTONE: "bg-orange-500",
  MEETING: "bg-indigo-500",
  OTHER: "bg-gray-500",
};

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-gray-400",
};

export function TimelineView({ 
  deadlines, 
  projects,
  onDeadlineClick,
  onCreateNew 
}: TimelineViewProps) {
  const today = new Date();
  const viewStart = subMonths(today, 1);
  const viewEnd = addMonths(today, 2);
  
  // Generate timeline days
  const timelineDays = useMemo(() => {
    return eachDayOfInterval({ start: viewStart, end: viewEnd });
  }, [viewStart, viewEnd]);

  // Group deadlines by project
  const deadlinesByProject = useMemo(() => {
    const grouped: Record<string, Deadline[]> = {
      unassigned: []
    };
    
    // Initialize with all projects
    projects.forEach(project => {
      grouped[project.id] = [];
    });
    
    // Group deadlines
    deadlines.forEach(deadline => {
      if (deadline.projectId && grouped[deadline.projectId]) {
        grouped[deadline.projectId].push(deadline);
      } else {
        grouped.unassigned.push(deadline);
      }
    });
    
    // Sort deadlines within each project by date
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    });
    
    return grouped;
  }, [deadlines, projects]);

  // Calculate position on timeline
  const getPositionPercentage = (date: Date) => {
    const totalDays = differenceInDays(viewEnd, viewStart);
    const daysFromStart = differenceInDays(date, viewStart);
    return (daysFromStart / totalDays) * 100;
  };

  // Calculate deadline bar width (all deadlines are single day for now)
  const getBarWidth = () => {
    const totalDays = differenceInDays(viewEnd, viewStart);
    return (1 / totalDays) * 100;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Timeline Header - Months and Days */}
      <div className="border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 bg-white dark:bg-gray-900">
        <div className="flex">
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Studies / Deadlines
            </h3>
          </div>
          <div className="flex-1 relative overflow-hidden">
            {/* Month headers */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {Array.from({ length: 4 }, (_, i) => {
                const month = addMonths(viewStart, i);
                return (
                  <div
                    key={i}
                    className="flex-1 px-2 py-2 text-sm font-medium text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700"
                  >
                    {format(month, 'MMMM yyyy')}
                  </div>
                );
              })}
            </div>
            
            {/* Day markers */}
            <div className="relative h-8 border-b border-gray-200 dark:border-gray-700">
              {timelineDays.filter((_, i) => i % 7 === 0).map(day => (
                <div
                  key={day.toISOString()}
                  className="absolute text-xs text-gray-500 dark:text-gray-400"
                  style={{ left: `${getPositionPercentage(day)}%` }}
                >
                  {format(day, 'd')}
                </div>
              ))}
              
              {/* Today marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                style={{ left: `${getPositionPercentage(today)}%` }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-1 rounded">
                  Today
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Unassigned Deadlines */}
        {deadlinesByProject.unassigned.length > 0 && (
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unassigned
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({deadlinesByProject.unassigned.length})
                </span>
              </div>
            </div>
            <div className="flex-1 relative py-2">
              {deadlinesByProject.unassigned.map((deadline, idx) => (
                <DeadlineBar
                  key={deadline.id}
                  deadline={deadline}
                  position={getPositionPercentage(deadline.dueDate)}
                  width={getBarWidth()}
                  offset={idx * 28}
                  onClick={() => onDeadlineClick?.(deadline)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Project Rows */}
        {projects.map(project => {
          const projectDeadlines = deadlinesByProject[project.id] || [];
          if (projectDeadlines.length === 0) return null;

          return (
            <div key={project.id} className="flex border-b border-gray-200 dark:border-gray-700">
              <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center space-x-2">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {project.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({projectDeadlines.length})
                  </span>
                </div>
              </div>
              <div className="flex-1 relative py-2">
                {projectDeadlines.map((deadline, idx) => (
                  <DeadlineBar
                    key={deadline.id}
                    deadline={deadline}
                    position={getPositionPercentage(deadline.dueDate)}
                    width={getBarWidth()}
                    offset={idx * 28}
                    onClick={() => onDeadlineClick?.(deadline)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeadlineBar({ 
  deadline, 
  position, 
  width, 
  offset,
  onClick 
}: { 
  deadline: Deadline; 
  position: number; 
  width: number;
  offset: number;
  onClick: () => void;
}) {
  const Icon = typeIcons[deadline.type] || Calendar;
  const daysUntil = differenceInDays(deadline.dueDate, new Date());
  const isOverdue = daysUntil < 0;
  const isUrgent = daysUntil >= 0 && daysUntil <= 3;

  return (
    <div
      className={cn(
        "absolute h-6 rounded px-2 py-1 cursor-pointer hover:shadow-lg transition-all flex items-center space-x-1 text-xs text-white whitespace-nowrap overflow-hidden",
        typeColors[deadline.type] || "bg-gray-500",
        isOverdue && "ring-2 ring-red-500 ring-offset-1",
        isUrgent && "ring-2 ring-orange-500 ring-offset-1"
      )}
      style={{ 
        left: `${position}%`, 
        minWidth: '120px',
        top: `${offset}px`,
        zIndex: isOverdue || isUrgent ? 10 : 1
      }}
      onClick={onClick}
      title={`${deadline.title} - ${format(deadline.dueDate, 'MMM d, yyyy')}`}
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">{deadline.title}</span>
      {deadline.priority === 'CRITICAL' && (
        <AlertCircle className="h-3 w-3 text-white flex-shrink-0" />
      )}
    </div>
  );
}