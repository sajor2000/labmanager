'use client';

import { DocumentSection } from '@/components/documents/document-section';

export default function TestDocumentsPage() {
  // Test values - in real use, these would come from props or context
  const testEntityId = 'test-entity-123';
  const testLabId = 'test-lab-456';

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Document Upload Test Page</h1>
      
      <div className="grid gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Task Documents</h2>
          <DocumentSection
            entityType="TASK"
            entityId={testEntityId}
            labId={testLabId}
            defaultOpen={true}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Project Documents</h2>
          <DocumentSection
            entityType="PROJECT"
            entityId={testEntityId}
            labId={testLabId}
            defaultOpen={true}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Idea Documents</h2>
          <DocumentSection
            entityType="IDEA"
            entityId={testEntityId}
            labId={testLabId}
            defaultOpen={false}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Deadline Documents</h2>
          <DocumentSection
            entityType="DEADLINE"
            entityId={testEntityId}
            labId={testLabId}
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  );
}