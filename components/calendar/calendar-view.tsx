'use client';

import { useMemo } from 'react';
import { MonthView } from './month-view';
import { WeekView } from './week-view';
import { DayView } from './day-view';
import type { CalendarViewProps } from '@/types/calendar';

export function CalendarView({
  view,
  currentDate,
  events,
  onEventClick,
  onDateClick,
  isLoading = false,
}: CalendarViewProps) {
  // Filter and sort events for the current view
  const filteredEvents = useMemo(() => {
    return events.sort((a, b) => {
      const dateA = new Date(a.start);
      const dateB = new Date(b.start);
      return dateA.getTime() - dateB.getTime();
    });
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              Loading events...
            </span>
          </div>
        </div>
      </div>
    );
  }

  switch (view) {
    case 'month':
      return (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={onEventClick}
          onDateClick={onDateClick}
        />
      );
    case 'week':
      return (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={onEventClick}
          onDateClick={onDateClick}
        />
      );
    case 'day':
      return (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={onEventClick}
          onDateClick={onDateClick}
        />
      );
    default:
      return null;
  }
}