'use client';

import { 
  format,
  isSameDay,
  startOfDay,
  addHours
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

export function DayView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      return isSameDay(eventStart, currentDate) && eventStart.getHours() === hour;
    });
  };

  const getAllDayEvents = () => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      return isSameDay(eventStart, currentDate) && event.allDay;
    });
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'deadline':
        return 'bg-red-500 text-white';
      case 'meeting':
        return 'bg-blue-500 text-white';
      case 'milestone':
        return 'bg-green-500 text-white';
      case 'reminder':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const allDayEvents = getAllDayEvents();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="flex-shrink-0 border-b dark:border-gray-800 p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            All-day events
          </div>
          <div className="space-y-1">
            {allDayEvents.map(event => (
              <div
                key={event.id}
                className={cn(
                  'px-3 py-2 rounded cursor-pointer hover:opacity-80',
                  getEventColor(event.type)
                )}
                onClick={() => onEventClick(event)}
              >
                <div className="font-medium">{event.title}</div>
                {event.location && (
                  <div className="text-sm opacity-75">{event.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {hours.map(hour => {
            const hourEvents = getEventsForHour(hour);
            const timeString = format(addHours(startOfDay(new Date()), hour), 'HH:mm');
            
            return (
              <div
                key={hour}
                className="flex border-b dark:border-gray-800 min-h-[80px]"
              >
                {/* Time label */}
                <div className="flex-shrink-0 w-20 p-3 text-sm text-gray-500 dark:text-gray-400">
                  {timeString}
                </div>

                {/* Events for this hour */}
                <div
                  className="flex-1 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => {
                    const clickedDate = new Date(currentDate);
                    clickedDate.setHours(hour);
                    onDateClick(clickedDate);
                  }}
                >
                  <div className="space-y-2">
                    {hourEvents.map(event => {
                      const eventStart = new Date(event.start);
                      const eventEnd = new Date(event.end);
                      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60); // minutes
                      
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'px-3 py-2 rounded cursor-pointer hover:opacity-80',
                            getEventColor(event.type)
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm opacity-75">
                                {format(eventStart, 'HH:mm')} - {format(eventEnd, 'HH:mm')}
                                {duration > 0 && ` (${duration} min)`}
                              </div>
                              {event.location && (
                                <div className="text-sm opacity-75 mt-1">
                                  📍 {event.location}
                                </div>
                              )}
                              {event.description && (
                                <div className="text-sm opacity-75 mt-1 line-clamp-2">
                                  {event.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}