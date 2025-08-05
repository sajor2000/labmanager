'use client';

import { useState } from 'react';
import { Monitor, Smartphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EmailPreviewProps {
  labName: string;
  meetingDate: Date;
  participants: Array<{ name: string; initials: string }>;
  summary?: string;
  actionItems: Array<{
    description: string;
    assignee?: { name: string } | null;
    dueDate?: Date | null;
    completed: boolean;
  }>;
  blockers: Array<{
    description: string;
    resolved: boolean;
  }>;
  decisions: Array<{
    description: string;
  }>;
  isLoading?: boolean;
  className?: string;
}

export function EmailPreview({
  labName,
  meetingDate,
  participants,
  summary,
  actionItems,
  blockers,
  decisions,
  isLoading = false,
  className,
}: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Generating preview...
          </p>
        </div>
      </div>
    );
  }

  const uncompletedActionItems = actionItems.filter(item => !item.completed);
  const unresolvedBlockers = blockers.filter(blocker => !blocker.resolved);

  return (
    <div className={cn('space-y-4', className)}>
      {/* View Mode Toggle */}
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === 'desktop' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('desktop')}
          className="gap-2"
        >
          <Monitor className="h-4 w-4" />
          Desktop
        </Button>
        <Button
          variant={viewMode === 'mobile' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('mobile')}
          className="gap-2"
        >
          <Smartphone className="h-4 w-4" />
          Mobile
        </Button>
      </div>

      {/* Email Preview Container */}
      <div
        className={cn(
          'mx-auto overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950',
          viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[600px]'
        )}
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {labName}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Standup Meeting Notes
            </p>
            <p className="mt-2 text-base font-semibold text-gray-800 dark:text-gray-200">
              {format(meetingDate, 'MMMM d, yyyy')}
            </p>
          </div>

          <hr className="my-6 border-gray-200 dark:border-gray-700" />

          {/* Participants */}
          <div className="mb-6">
            <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
              Participants ({participants.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                    {participant.initials}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {participant.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="mb-6">
              <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                Meeting Summary
              </h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {summary}
              </p>
            </div>
          )}

          {/* Action Items */}
          {actionItems.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
                Action Items ({uncompletedActionItems.length} pending)
              </h3>
              <div className="space-y-2">
                {actionItems.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          'mt-0.5 h-4 w-4 rounded',
                          item.completed
                            ? 'bg-green-500'
                            : 'border-2 border-gray-300 bg-white dark:border-gray-600'
                        )}
                      >
                        {item.completed && (
                          <span className="block text-center text-xs leading-3 text-white">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={cn(
                            'text-sm',
                            item.completed
                              ? 'text-gray-500 line-through dark:text-gray-400'
                              : 'text-gray-800 dark:text-gray-200'
                          )}
                        >
                          {item.description}
                        </p>
                        <div className="mt-1 flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                          {item.assignee && <span>👤 {item.assignee.name}</span>}
                          {item.dueDate && (
                            <span>📅 {format(item.dueDate, 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {actionItems.length > 3 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    + {actionItems.length - 3} more items...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Blockers */}
          {blockers.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
                Blockers ({unresolvedBlockers.length} unresolved)
              </h3>
              <div className="space-y-2">
                {blockers.slice(0, 2).map((blocker, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg border p-3',
                      blocker.resolved
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm',
                        blocker.resolved
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      )}
                    >
                      {blocker.resolved ? '✓' : '⚠️'} {blocker.description}
                    </p>
                  </div>
                ))}
                {blockers.length > 2 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    + {blockers.length - 2} more blockers...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Key Decisions */}
          {decisions.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
                Key Decisions
              </h3>
              <div className="space-y-1">
                {decisions.slice(0, 3).map((decision, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-sm text-green-600 dark:text-green-400">•</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {decision.description}
                    </p>
                  </div>
                ))}
                {decisions.length > 3 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    + {decisions.length - 3} more decisions...
                  </p>
                )}
              </div>
            </div>
          )}

          <hr className="my-6 border-gray-200 dark:border-gray-700" />

          {/* CTA Button Preview */}
          <div className="text-center">
            <div className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white">
              View Full Transcript
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>This email was sent from {labName}</p>
            <p className="mt-1">
              <span className="text-blue-600">View in browser</span>
              {' • '}
              <span className="text-blue-600">Unsubscribe</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}