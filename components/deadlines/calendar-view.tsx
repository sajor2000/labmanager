"use client";

import { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  AlertCircle,
  FileText,
  Users,
  Plus
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  isToday,
  isPast,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInDays
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
  recurring?: string;
  status?: string;
}

interface CalendarViewProps {
  deadlines: Deadline[];
  onDeadlineClick?: (deadline: Deadline) => void;
  onDateClick?: (date: Date) => void;
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

const priorityBorders: Record<string, string> = {
  CRITICAL: "border-red-500 border-2",
  HIGH: "border-orange-500 border-2",
  MEDIUM: "border-yellow-500 border",
  LOW: "border-gray-300 border",
};

export function CalendarView({ 
  deadlines, 
  onDeadlineClick, 
  onDateClick,
  onCreateNew 
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group deadlines by date
  const deadlinesByDate = useMemo(() => {
    const grouped: Record<string, Deadline[]> = {};
    deadlines.forEach(deadline => {
      const dateKey = format(deadline.dueDate, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(deadline);
    });
    return grouped;
  }, [deadlines]);

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return deadlines
      .filter(d => d.dueDate >= today && d.dueDate <= nextWeek)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [deadlines]);

  // Get overdue deadlines
  const overdueDeadlines = useMemo(() => {
    const today = new Date();
    return deadlines
      .filter(d => isPast(d.dueDate) && !isSameDay(d.dueDate, today))
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  }, [deadlines]);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const getDeadlineUrgency = (deadline: Deadline) => {
    const daysUntil = differenceInDays(deadline.dueDate, new Date());
    if (daysUntil < 0) return "overdue";
    if (daysUntil === 0) return "today";
    if (daysUntil <= 3) return "urgent";
    if (daysUntil <= 7) return "soon";
    return "normal";
  };

  return (
    <div className="flex h-full">
      {/* Calendar Section */}
      <div className="flex-1 flex flex-col">
        {/* Calendar Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePreviousMonth}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("month")}
                  className={cn(
                    "px-3 py-1 text-sm rounded",
                    viewMode === "month" 
                      ? "bg-white dark:bg-gray-600 shadow-sm" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-600"
                  )}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={cn(
                    "px-3 py-1 text-sm rounded",
                    viewMode === "week" 
                      ? "bg-white dark:bg-gray-600 shadow-sm" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-600"
                  )}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode("day")}
                  className={cn(
                    "px-3 py-1 text-sm rounded",
                    viewMode === "day" 
                      ? "bg-white dark:bg-gray-600 shadow-sm" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-600"
                  )}
                >
                  Day
                </button>
              </div>
              <button
                onClick={onCreateNew}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Deadline</span>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-white dark:bg-gray-900 p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {calendarDays.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayDeadlines = deadlinesByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasDeadlines = dayDeadlines.length > 0;

              return (
                <div
                  key={dateKey}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors",
                    isCurrentMonth 
                      ? "bg-white dark:bg-gray-800" 
                      : "bg-gray-50 dark:bg-gray-900",
                    isToday(day) && "ring-2 ring-blue-500",
                    isSelected && "bg-blue-50 dark:bg-blue-900/20",
                    "hover:bg-gray-50 dark:hover:bg-gray-700",
                    hasDeadlines && "border-blue-300 dark:border-blue-600"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className={cn(
                      "text-sm font-medium",
                      isToday(day) && "text-blue-600 dark:text-blue-400",
                      !isCurrentMonth && "text-gray-400 dark:text-gray-600"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {hasDeadlines && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                        {dayDeadlines.length}
                      </span>
                    )}
                  </div>

                  {/* Mini Deadline List */}
                  <div className="mt-1 space-y-1">
                    {dayDeadlines.slice(0, 3).map(deadline => {
                      const Icon = typeIcons[deadline.type] || Calendar;
                      const urgency = getDeadlineUrgency(deadline);
                      
                      return (
                        <div
                          key={deadline.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeadlineClick?.(deadline);
                          }}
                          className={cn(
                            "text-xs p-1 rounded flex items-center space-x-1 hover:opacity-80 cursor-pointer",
                            typeColors[deadline.type] || "bg-gray-500",
                            "text-white"
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="truncate">{deadline.title}</span>
                        </div>
                      );
                    })}
                    {dayDeadlines.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{dayDeadlines.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar - Upcoming & Overdue */}
      <div className="w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Overdue Deadlines */}
          {overdueDeadlines.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Overdue ({overdueDeadlines.length})
              </h3>
              <div className="space-y-2">
                {overdueDeadlines.map(deadline => (
                  <DeadlineCard
                    key={deadline.id}
                    deadline={deadline}
                    onClick={() => onDeadlineClick?.(deadline)}
                    isOverdue
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Next 7 Days ({upcomingDeadlines.length})
            </h3>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No upcoming deadlines
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map(deadline => (
                  <DeadlineCard
                    key={deadline.id}
                    deadline={deadline}
                    onClick={() => onDeadlineClick?.(deadline)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeadlineCard({ 
  deadline, 
  onClick, 
  isOverdue = false 
}: { 
  deadline: Deadline; 
  onClick: () => void;
  isOverdue?: boolean;
}) {
  const Icon = typeIcons[deadline.type] || Calendar;
  const daysUntil = differenceInDays(deadline.dueDate, new Date());
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-colors",
        isOverdue 
          ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
          : "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600",
        priorityBorders[deadline.priority]
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn(
          "p-1.5 rounded",
          typeColors[deadline.type] || "bg-gray-500"
        )}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {deadline.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {format(deadline.dueDate, 'MMM d, yyyy')}
            {deadline.dueTime && ` at ${deadline.dueTime}`}
          </p>
          {deadline.projectName && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {deadline.projectName}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className={cn(
            "text-xs font-medium",
            isOverdue ? "text-red-600" : daysUntil === 0 ? "text-orange-600" : "text-gray-600"
          )}>
            {isOverdue 
              ? `${Math.abs(daysUntil)}d overdue`
              : daysUntil === 0 
                ? "Today"
                : `${daysUntil}d`
            }
          </p>
        </div>
      </div>
    </div>
  );
}