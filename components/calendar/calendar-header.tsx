'use client';

import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  Plus,
  Download,
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface CalendarHeaderProps {
  view: 'month' | 'week' | 'day';
  onViewChange: (view: 'month' | 'week' | 'day') => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onCreateEvent: () => void;
}

export function CalendarHeader({
  view,
  onViewChange,
  currentDate,
  onDateChange,
  onCreateEvent,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateRangeText = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      default:
        return '';
    }
  };

  return (
    <div className="border-b dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Navigation and Date Display */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8"
            >
              Today
            </Button>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getDateRangeText()}
            </h2>
          </div>

          {/* Right: View Toggle and Actions */}
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border dark:border-gray-700">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 rounded-r-none"
                onClick={() => onViewChange('month')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 rounded-none border-x dark:border-gray-700"
                onClick={() => onViewChange('week')}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Week
              </Button>
              <Button
                variant={view === 'day' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 rounded-l-none"
                onClick={() => onViewChange('day')}
              >
                <CalendarRange className="h-4 w-4 mr-2" />
                Day
              </Button>
            </div>

            {/* Filter Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>All Events</DropdownMenuItem>
                <DropdownMenuItem>Deadlines</DropdownMenuItem>
                <DropdownMenuItem>Meetings</DropdownMenuItem>
                <DropdownMenuItem>Milestones</DropdownMenuItem>
                <DropdownMenuItem>Reminders</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Button */}
            <Button variant="outline" size="sm" className="h-8">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {/* Create Event Button */}
            <Button size="sm" className="h-8" onClick={onCreateEvent}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}