'use client';

import { useMemo } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  startOfDay,
  addHours
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

export function WeekView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      return isSameDay(eventStart, day) && eventStart.getHours() === hour;
    });
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'deadline':
        return 'bg-red-500 text-white border-red-600';
      case 'meeting':
        return 'bg-blue-500 text-white border-blue-600';
      case 'milestone':
        return 'bg-green-500 text-white border-green-600';
      case 'reminder':
        return 'bg-yellow-500 text-white border-yellow-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed header with day names */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="grid grid-cols-8 h-16">
          <div className="border-r dark:border-gray-800 p-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            GMT
          </div>
          {weekDays.map(day => {
            const isCurrentDay = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'border-r dark:border-gray-800 p-2 text-center',
                  isCurrentDay && 'bg-blue-50 dark:bg-blue-950/30'
                )}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold',
                    isCurrentDay && 'text-blue-600 dark:text-blue-400'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 h-16 border-b dark:border-gray-800">
              <div className="border-r dark:border-gray-800 p-2 text-xs text-gray-500 dark:text-gray-400">
                {format(addHours(startOfDay(new Date()), hour), 'HH:mm')}
              </div>
              {weekDays.map(day => {
                const dayEvents = getEventsForDayAndHour(day, hour);
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      'border-r dark:border-gray-800 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
                      isCurrentDay && 'bg-blue-50/50 dark:bg-blue-950/20'
                    )}
                    onClick={() => {
                      const clickedDate = new Date(day);
                      clickedDate.setHours(hour);
                      onDateClick(clickedDate);
                    }}
                  >
                    <div className="space-y-1">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className={cn(
                            'text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80',
                            getEventColor(event.type)
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          title={event.title}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-75">
                            {format(new Date(event.start), 'HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}