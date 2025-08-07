'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CreateStudyPayload } from '@/types/study';
import type { Bucket } from '@/types/bucket';
import type { TeamMember } from '@/types/team';

interface CreateStudyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateStudyPayload) => Promise<void>;
  buckets: Bucket[];
  teamMembers: TeamMember[];
}

export function CreateStudyDialog({
  open,
  onOpenChange,
  onSubmit,
  buckets,
  teamMembers,
}: CreateStudyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateStudyPayload>>({
    name: '',
    description: '',
    status: 'Planning',
    priority: 'Medium',
    oraNumber: '',
    studyType: '',
    fundingSource: '',
    externalCollaborators: '',
    notes: '',
  });
  const [dueDate, setDueDate] = useState<Date>();
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        name: formData.name,
        dueDate: dueDate?.toISOString(),
        assignees: selectedAssignees,
      } as CreateStudyPayload);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'Planning',
        priority: 'Medium',
        oraNumber: '',
        studyType: '',
        fundingSource: '',
        externalCollaborators: '',
        notes: '',
      });
      setDueDate(undefined);
      setSelectedAssignees([]);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a new research study</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Study Name *</Label>
              <Input
                id="name"
                placeholder="Enter study name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ora">ORA Number</Label>
              <Input
                id="ora"
                placeholder="e.g., ORA-2024-001"
                value={formData.oraNumber}
                onChange={(e) => setFormData({ ...formData, oraNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="IRB Submission">IRB Submission</SelectItem>
                  <SelectItem value="IRB Approved">IRB Approved</SelectItem>
                  <SelectItem value="Data Collection">Data Collection</SelectItem>
                  <SelectItem value="Analysis">Analysis</SelectItem>
                  <SelectItem value="Manuscript">Manuscript</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bucket">Bucket</Label>
              <Select
                value={formData.bucketId}
                onValueChange={(value) => setFormData({ ...formData, bucketId: value })}
              >
                <SelectTrigger id="bucket">
                  <SelectValue placeholder="Select bucket" />
                </SelectTrigger>
                <SelectContent>
                  {buckets.map(bucket => (
                    <SelectItem key={bucket.id} value={bucket.id}>
                      {bucket.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="funding">Funding Source</Label>
              <Select
                value={formData.fundingSource}
                onValueChange={(value) => setFormData({ ...formData, fundingSource: value })}
              >
                <SelectTrigger id="funding">
                  <SelectValue placeholder="Select funding source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIH">NIH</SelectItem>
                  <SelectItem value="NSF">NSF</SelectItem>
                  <SelectItem value="Industry Sponsored">Industry Sponsored</SelectItem>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="Foundation">Foundation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studyType">Study Type</Label>
              <Input
                id="studyType"
                placeholder="e.g., Retrospective, Prospective..."
                value={formData.studyType}
                onChange={(e) => setFormData({ ...formData, studyType: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="collaborators">External Collaborators</Label>
            <Textarea
              id="collaborators"
              placeholder="List external collaborators..."
              value={formData.externalCollaborators}
              onChange={(e) => setFormData({ ...formData, externalCollaborators: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about the study..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name}>
              {isSubmitting ? 'Creating...' : 'Create Study'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}