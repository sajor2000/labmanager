"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useServerAction } from "@/hooks/use-server-action";
import { createStudy, updateStudy } from "@/app/actions/study-actions";
import { useCurrentUser } from "@/hooks/use-current-user";

interface Props {
  study?: any | null;
  isOpen: boolean;
  onClose: () => void;
  buckets: any[];
  users: any[];
}

export function StudyEditModal({ study, isOpen, onClose, buckets, users }: Props) {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const isEditMode = !!study;
  
  const { execute: executeCreate, isLoading: isCreating } = useServerAction(
    createStudy,
    {
      successMessage: "Study created successfully",
      onSuccess: () => {
        onClose();
        router.refresh();
      },
    }
  );

  const { execute: executeUpdate, isLoading: isUpdating } = useServerAction(
    updateStudy,
    {
      successMessage: "Study updated successfully",
      onSuccess: () => {
        onClose();
        router.refresh();
      },
    }
  );

  const [formData, setFormData] = useState({
    title: "",
    oraNumber: "",
    status: "PLANNING",
    priority: "MEDIUM",
    studyType: "",
    bucketId: "",
    labId: "",
    fundingSource: "",
    fundingDetails: "",
    externalCollaborators: "",
    dueDate: undefined as Date | undefined,
    notes: "",
    progress: 0,
    assigneeIds: [] as string[],
  });

  useEffect(() => {
    if (study) {
      setFormData({
        title: study.name || study.title || "",
        oraNumber: study.oraNumber || "",
        status: study.status || "PLANNING",
        priority: study.priority || "MEDIUM",
        studyType: study.projectType || study.studyType || "",
        bucketId: study.bucketId || study.bucket?.id || "",
        labId: study.labId || study.lab?.id || "",
        fundingSource: study.fundingSource || "",
        fundingDetails: study.fundingDetails || "",
        externalCollaborators: study.externalCollaborators || "",
        dueDate: study.dueDate ? new Date(study.dueDate) : undefined,
        notes: study.notes || "",
        progress: study.progress || 0,
        assigneeIds: study.members?.map((a: any) => a.user?.id || a.userId) || study.assignees?.map((a: any) => a.user?.id || a.userId) || [],
      });
    } else {
      // Reset form for new study
      setFormData({
        title: "",
        oraNumber: "",
        status: "PLANNING",
        priority: "MEDIUM",
        studyType: "",
        bucketId: buckets[0]?.id || "",
        labId: buckets[0]?.labId || "",
        fundingSource: "",
        fundingDetails: "",
        externalCollaborators: "",
        dueDate: undefined,
        notes: "",
        progress: 0,
        assigneeIds: [],
      });
    }
  }, [study, buckets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      studyName: formData.title, // For create action compatibility
      dueDate: formData.dueDate?.toISOString(),
      createdById: currentUser?.id || "guest",
    };

    if (isEditMode) {
      await executeUpdate({
        id: study.id,
        ...submitData,
      } as any);
    } else {
      await executeCreate(submitData as any);
    }
  };

  const toggleAssignee = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter((id) => id !== userId)
        : [...prev.assigneeIds, userId],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Study" : "Create New Study"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the study details below"
              : "Fill in the information to create a new research study"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Study Title*</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter study title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oraNumber">ORA Number</Label>
                <Input
                  id="oraNumber"
                  value={formData.oraNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, oraNumber: e.target.value })
                  }
                  placeholder="e.g., ORA-2024-001"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="IRB_SUBMISSION">IRB Submission</SelectItem>
                    <SelectItem value="IRB_APPROVED">IRB Approved</SelectItem>
                    <SelectItem value="DATA_COLLECTION">Data Collection</SelectItem>
                    <SelectItem value="ANALYSIS">Analysis</SelectItem>
                    <SelectItem value="MANUSCRIPT">Manuscript</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bucket">Bucket*</Label>
                <Select
                  value={formData.bucketId}
                  onValueChange={(value) => {
                    const bucket = buckets.find((b) => b.id === value);
                    setFormData({
                      ...formData,
                      bucketId: value,
                      labId: bucket?.labId || formData.labId,
                    });
                  }}
                >
                  <SelectTrigger id="bucket">
                    <SelectValue placeholder="Select bucket" />
                  </SelectTrigger>
                  <SelectContent>
                    {buckets.map((bucket) => (
                      <SelectItem key={bucket.id} value={bucket.id}>
                        {bucket.name || bucket.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="studyType">Study Type*</Label>
                <Input
                  id="studyType"
                  value={formData.studyType}
                  onChange={(e) =>
                    setFormData({ ...formData, studyType: e.target.value })
                  }
                  placeholder="e.g., Retrospective, Prospective, RCT"
                  required
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
                        !formData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? (
                        format(formData.dueDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, dueDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Funding Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Funding Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fundingSource">Funding Source</Label>
                <Select
                  value={formData.fundingSource}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fundingSource: value })
                  }
                >
                  <SelectTrigger id="fundingSource">
                    <SelectValue placeholder="Select funding source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="NIH">NIH</SelectItem>
                    <SelectItem value="NSF">NSF</SelectItem>
                    <SelectItem value="INDUSTRY_SPONSORED">
                      Industry Sponsored
                    </SelectItem>
                    <SelectItem value="INTERNAL">Internal</SelectItem>
                    <SelectItem value="FOUNDATION">Foundation</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingDetails">Funding Details</Label>
                <Input
                  id="fundingDetails"
                  value={formData.fundingDetails}
                  onChange={(e) =>
                    setFormData({ ...formData, fundingDetails: e.target.value })
                  }
                  placeholder="e.g., Grant number, amount"
                />
              </div>
            </div>
          </div>

          {/* Collaborators */}
          <div className="space-y-2">
            <Label htmlFor="collaborators">External Collaborators</Label>
            <Textarea
              id="collaborators"
              value={formData.externalCollaborators}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  externalCollaborators: e.target.value,
                })
              }
              placeholder="List external collaborators and institutions"
              rows={2}
            />
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Assignees</Label>
            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <Badge
                  key={user.id}
                  variant={
                    formData.assigneeIds.includes(user.id)
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleAssignee(user.id)}
                >
                  {user.name}
                  {formData.assigneeIds.includes(user.id) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Label htmlFor="progress">
              Progress: {formData.progress}%
            </Label>
            <Slider
              id="progress"
              value={[formData.progress]}
              onValueChange={(value) =>
                setFormData({ ...formData, progress: value[0] })
              }
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes about the study"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating
                ? "Saving..."
                : isEditMode
                ? "Update Study"
                : "Create Study"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}