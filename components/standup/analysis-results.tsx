'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  Users, 
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Target,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface ActionItem {
  id: string;
  description: string;
  assignee?: {
    id: string;
    name: string;
    initials: string;
  } | null;
  dueDate?: Date | null;
  completed: boolean;
}

interface Blocker {
  id: string;
  description: string;
  resolved: boolean;
}

interface Decision {
  id: string;
  description: string;
}

interface Participant {
  id: string;
  user: {
    id: string;
    name: string;
    initials: string;
  };
}

interface AnalysisResultsProps {
  summary?: string;
  actionItems: ActionItem[];
  blockers: Blocker[];
  decisions: Decision[];
  participants: Participant[];
  onActionItemToggle?: (id: string, completed: boolean) => void;
  onBlockerToggle?: (id: string, resolved: boolean) => void;
  className?: string;
}

export function AnalysisResults({
  summary,
  actionItems = [],
  blockers = [],
  decisions = [],
  participants = [],
  onActionItemToggle,
  onBlockerToggle,
  className,
}: AnalysisResultsProps) {
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    actionItems: true,
    blockers: true,
    decisions: true,
    participants: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Calculate stats
  const completedActionItems = actionItems.filter(item => item.completed).length;
  const resolvedBlockers = blockers.filter(blocker => blocker.resolved).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Card */}
      {summary && (
        <Card className="overflow-hidden">
          <div
            className="flex cursor-pointer items-center justify-between p-4"
            onClick={() => toggleSection('summary')}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Meeting Summary
              </h3>
            </div>
            {expandedSections.summary ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
          {expandedSections.summary && (
            <div className="border-t border-gray-200 px-4 pb-4 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {summary}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Action Items */}
      <Card className="overflow-hidden">
        <div
          className="flex cursor-pointer items-center justify-between p-4"
          onClick={() => toggleSection('actionItems')}
        >
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Action Items
            </h3>
            <Badge variant="outline" className="ml-2">
              {completedActionItems}/{actionItems.length}
            </Badge>
          </div>
          {expandedSections.actionItems ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
        {expandedSections.actionItems && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            {actionItems.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No action items identified.
              </p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {actionItems.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) => 
                          onActionItemToggle?.(item.id, checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-1">
                        <p
                          className={cn(
                            'text-sm text-gray-700 dark:text-gray-300',
                            item.completed && 'line-through opacity-60'
                          )}
                        >
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {item.assignee && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{item.assignee.name}</span>
                            </div>
                          )}
                          {item.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(item.dueDate, 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Blockers */}
      <Card className="overflow-hidden">
        <div
          className="flex cursor-pointer items-center justify-between p-4"
          onClick={() => toggleSection('blockers')}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Blockers
            </h3>
            {blockers.length > 0 && (
              <Badge
                variant="outline"
                className={cn(
                  'ml-2',
                  resolvedBlockers === blockers.length
                    ? 'border-green-600 text-green-600'
                    : 'border-red-600 text-red-600'
                )}
              >
                {resolvedBlockers}/{blockers.length} resolved
              </Badge>
            )}
          </div>
          {expandedSections.blockers ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
        {expandedSections.blockers && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            {blockers.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No blockers identified.
              </p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {blockers.map((blocker) => (
                  <div key={blocker.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={blocker.resolved}
                        onCheckedChange={(checked) =>
                          onBlockerToggle?.(blocker.id, checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p
                          className={cn(
                            'text-sm text-gray-700 dark:text-gray-300',
                            blocker.resolved && 'line-through opacity-60'
                          )}
                        >
                          {blocker.description}
                        </p>
                        {blocker.resolved && (
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                            Resolved
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Decisions */}
      <Card className="overflow-hidden">
        <div
          className="flex cursor-pointer items-center justify-between p-4"
          onClick={() => toggleSection('decisions')}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Key Decisions
            </h3>
            {decisions.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {decisions.length}
              </Badge>
            )}
          </div>
          {expandedSections.decisions ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
        {expandedSections.decisions && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            {decisions.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No key decisions identified.
              </p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {decisions.map((decision) => (
                  <div key={decision.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {decision.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Participants */}
      {participants.length > 0 && (
        <Card className="overflow-hidden">
          <div
            className="flex cursor-pointer items-center justify-between p-4"
            onClick={() => toggleSection('participants')}
          >
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Participants
              </h3>
              <Badge variant="outline" className="ml-2">
                {participants.length}
              </Badge>
            </div>
            {expandedSections.participants ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
          {expandedSections.participants && (
            <div className="border-t border-gray-200 px-4 pb-4 dark:border-gray-700">
              <div className="mt-3 flex flex-wrap gap-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-medium text-white">
                      {participant.user.initials}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {participant.user.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}