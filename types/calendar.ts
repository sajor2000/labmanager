export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  type: 'deadline' | 'meeting' | 'milestone' | 'reminder' | 'other';
  color?: string;
  location?: string;
  attendees?: string[];
  projectId?: string;
  projectName?: string;
  labId: string;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: Date | string;
    daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  };
  reminder?: {
    enabled: boolean;
    minutes: number; // minutes before event
  };
  status?: 'tentative' | 'confirmed' | 'cancelled';
  url?: string;
  notes?: string;
}

export interface CalendarViewProps {
  view: 'month' | 'week' | 'day';
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  isLoading?: boolean;
}

export interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  onDelete?: () => void;
}