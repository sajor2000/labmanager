'use client';

import { useState } from 'react';
import { Paperclip, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DocumentUpload } from './document-upload';
import { DocumentList } from './document-list';
import { cn } from '@/lib/utils';

interface DocumentSectionProps {
  entityType: 'TASK' | 'IDEA' | 'DEADLINE' | 'PROJECT' | 'COMMENT' | 'ACTION_ITEM';
  entityId: string;
  labId: string;
  title?: string;
  className?: string;
  defaultOpen?: boolean;
}

export function DocumentSection({
  entityType,
  entityId,
  labId,
  title = 'Documents',
  className,
  defaultOpen = false
}: DocumentSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className={cn("space-y-4 rounded-lg border p-4", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="p-0 hover:bg-transparent">
              <Paperclip className="mr-2 h-4 w-4" />
              <span className="font-medium">{title}</span>
            </Button>
          </CollapsibleTrigger>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUpload(!showUpload)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>

        <CollapsibleContent className="space-y-4 pt-4">
          {showUpload && (
            <DocumentUpload
              entityType={entityType}
              entityId={entityId}
              labId={labId}
              onUploadComplete={() => setShowUpload(false)}
            />
          )}
          
          <DocumentList
            entityType={entityType}
            entityId={entityId}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}