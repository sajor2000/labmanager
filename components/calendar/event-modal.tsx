'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Link, Bell, Trash2 } from 'lucide-react';
import type { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';

interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  onDelete?: () => void;
}

export function EventModal({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EventModalProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    type: 'meeting',
    start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
    allDay: false,
    location: '',
    url: '',
    reminder: { enabled: true, minutes: 15 },
  });

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        start: typeof event.start === 'string' 
          ? event.start 
          : format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"),
        end: typeof event.end === 'string'
          ? event.end
          : format(new Date(event.end), "yyyy-MM-dd'T'HH:mm"),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'meeting',
        start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
        allDay: false,
        location: '',
        url: '',
        reminder: { enabled: true, minutes: 15 },
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const eventTypeColors = {
    deadline: 'text-red-600',
    meeting: 'text-blue-600',
    milestone: 'text-green-600',
    reminder: 'text-yellow-600',
    other: 'text-gray-600',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {event ? 'Edit Event' : 'New Event'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as CalendarEvent['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">
                    <span className={eventTypeColors.deadline}>Deadline</span>
                  </SelectItem>
                  <SelectItem value="meeting">
                    <span className={eventTypeColors.meeting}>Meeting</span>
                  </SelectItem>
                  <SelectItem value="milestone">
                    <span className={eventTypeColors.milestone}>Milestone</span>
                  </SelectItem>
                  <SelectItem value="reminder">
                    <span className={eventTypeColors.reminder}>Reminder</span>
                  </SelectItem>
                  <SelectItem value="other">
                    <span className={eventTypeColors.other}>Other</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="allDay"
                checked={formData.allDay}
                onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked })}
              />
              <Label htmlFor="allDay">All day event</Label>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start {!formData.allDay && 'Date & Time'}
                </Label>
                <Input
                  id="start"
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  value={typeof formData.start === 'string' ? formData.start : ''}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  End {!formData.allDay && 'Date & Time'}
                </Label>
                <Input
                  id="end"
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  value={typeof formData.end === 'string' ? formData.end : ''}
                  onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid gap-2">
              <Label htmlFor="location">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location or meeting room"
              />
            </div>

            {/* URL */}
            <div className="grid gap-2">
              <Label htmlFor="url">
                <Link className="inline h-4 w-4 mr-1" />
                Meeting Link / URL
              </Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://zoom.us/..."
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter event description or agenda"
                rows={3}
              />
            </div>

            {/* Reminder */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="reminder"
                  checked={formData.reminder?.enabled}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      reminder: { ...formData.reminder!, enabled: checked } 
                    })
                  }
                />
                <Label htmlFor="reminder">
                  <Bell className="inline h-4 w-4 mr-1" />
                  Reminder
                </Label>
              </div>
              {formData.reminder?.enabled && (
                <Select
                  value={formData.reminder?.minutes?.toString()}
                  onValueChange={(value) => 
                    setFormData({ 
                      ...formData, 
                      reminder: { ...formData.reminder!, minutes: parseInt(value) } 
                    })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes before</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {event && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {event ? 'Update' : 'Create'} Event
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}