'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusColors = [
  { status: 'planning', color: 'bg-blue-500', label: 'Planning' },
  { status: 'irb-submission', color: 'bg-amber-500', label: 'IRB Submission' },
  { status: 'irb-approved', color: 'bg-green-500', label: 'IRB Approved' },
  { status: 'data-collection', color: 'bg-cyan-500', label: 'Data Collection' },
  { status: 'analysis', color: 'bg-purple-500', label: 'Analysis' },
  { status: 'manuscript', color: 'bg-indigo-500', label: 'Manuscript' },
  { status: 'under-review', color: 'bg-yellow-500', label: 'Under Review' },
  { status: 'published', color: 'bg-emerald-500', label: 'Published' },
  { status: 'on-hold', color: 'bg-gray-500', label: 'On Hold' },
  { status: 'cancelled', color: 'bg-red-500', label: 'Cancelled' },
];

export function KanbanLegend() {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
      <span className="text-sm font-medium text-gray-700">Status Legend:</span>
      <div className="flex flex-wrap gap-2">
        {statusColors.map(({ status, color, label }) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded", color)} />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}