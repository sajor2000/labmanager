'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, Calendar, User, FolderOpen, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useStudy } from '@/hooks/use-api';
import type { UpdateStudyPayload } from '@/types/study';

interface StudyDetailsDialogProps {
  studyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: UpdateStudyPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function StudyDetailsDialog({
  studyId,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: StudyDetailsDialogProps) {
  const { data: study, isLoading } = useStudy(studyId);
  const [isEditing, setIsEditing] = useState(false);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : study ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">{study.name}</DialogTitle>
                  {study.oraNumber && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ORA: {study.oraNumber}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(study.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Status</p>
                    <Badge variant="secondary">{study.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Priority</p>
                    <Badge variant="outline">{study.priority}</Badge>
                  </div>
                </div>

                {study.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{study.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {study.dueDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Due Date</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(study.dueDate), 'PPP')}
                        </p>
                      </div>
                    </div>
                  )}

                  {study.bucketId && (
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Bucket</p>
                        <p className="text-sm text-muted-foreground">{study.bucketId}</p>
                      </div>
                    </div>
                  )}
                </div>

                {study.assignees && study.assignees.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Assignees</p>
                    <div className="flex flex-wrap gap-2">
                      {study.assignees.map((assignee, idx) => (
                        <Badge key={idx} variant="secondary">
                          <User className="h-3 w-3 mr-1" />
                          {assignee}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {study.studyType && (
                    <div>
                      <p className="text-sm font-medium mb-1">Study Type</p>
                      <p className="text-sm text-muted-foreground">{study.studyType}</p>
                    </div>
                  )}

                  {study.fundingSource && (
                    <div>
                      <p className="text-sm font-medium mb-1">Funding Source</p>
                      <p className="text-sm text-muted-foreground">{study.fundingSource}</p>
                    </div>
                  )}
                </div>

                {study.externalCollaborators && (
                  <div>
                    <p className="text-sm font-medium mb-1">External Collaborators</p>
                    <p className="text-sm text-muted-foreground">{study.externalCollaborators}</p>
                  </div>
                )}

                {study.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{study.notes}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-1">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(study.createdAt), 'PPP')}
                  </p>
                </div>

                {study.updatedAt && (
                  <div>
                    <p className="text-sm font-medium mb-1">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(study.updatedAt), 'PPP')}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tasks">
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              </TabsContent>

              <TabsContent value="activity">
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Study not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}