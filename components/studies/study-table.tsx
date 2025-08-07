'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import type { Study } from '@/types/study';
import { cn } from '@/lib/utils';

interface StudyTableProps {
  studies: Study[];
  selectedStudies: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onStudyClick: (studyId: string) => void;
}

const statusColors = {
  planning: 'bg-blue-500',
  active: 'bg-green-500',
  completed: 'bg-gray-500',
  'on-hold': 'bg-yellow-500',
};

const priorityColors = {
  low: 'text-gray-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
};

export function StudyTable({ 
  studies, 
  selectedStudies, 
  onSelectionChange,
  onStudyClick 
}: StudyTableProps) {
  const toggleAll = () => {
    if (selectedStudies.size === studies.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(studies.map(s => s.id)));
    }
  };

  const toggleOne = (studyId: string) => {
    const newSelection = new Set(selectedStudies);
    if (newSelection.has(studyId)) {
      newSelection.delete(studyId);
    } else {
      newSelection.add(studyId);
    }
    onSelectionChange(newSelection);
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={studies.length > 0 && selectedStudies.size === studies.length}
                indeterminate={selectedStudies.size > 0 && selectedStudies.size < studies.length}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Bucket</TableHead>
            <TableHead>Assignees</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studies.map(study => (
            <TableRow 
              key={study.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onStudyClick(study.id)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedStudies.has(study.id)}
                  onCheckedChange={() => toggleOne(study.id)}
                />
              </TableCell>
              <TableCell className="font-medium">
                {study.name}
                {study.oraNumber && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({study.oraNumber})
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  <div className={cn("w-2 h-2 rounded-full mr-1", statusColors[study.status || 'planning'])} />
                  {study.status}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={cn("font-medium", priorityColors[study.priority || 'medium'])}>
                  {study.priority}
                </span>
              </TableCell>
              <TableCell>
                {study.bucketId ? (
                  <Badge variant="outline">{study.bucketId}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {study.assignees && study.assignees.length > 0 ? (
                  <div className="flex -space-x-2">
                    {study.assignees.slice(0, 3).map((assignee, idx) => (
                      <div
                        key={idx}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground ring-2 ring-background"
                        title={assignee}
                      >
                        {assignee.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {study.assignees.length > 3 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
                        +{study.assignees.length - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {study.dueDate ? (
                  format(new Date(study.dueDate), 'MMM d, yyyy')
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}