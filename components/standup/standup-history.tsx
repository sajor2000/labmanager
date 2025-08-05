'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Calendar, 
  Users, 
  FileAudio, 
  Search,
  ChevronRight,
  Target,
  AlertCircle,
  Lightbulb,
  Clock,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AudioControls } from './audio-controls';
import type { StandupWithRelations } from '@/lib/services/standup.service';

interface StandupHistoryProps {
  standups: StandupWithRelations[];
  onStandupSelect?: (standup: StandupWithRelations) => void;
  selectedStandupId?: string;
  className?: string;
}

export function StandupHistory({
  standups,
  onStandupSelect,
  selectedStandupId,
  className,
}: StandupHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStandupId, setExpandedStandupId] = useState<string | null>(null);

  // Filter standups based on search query
  const filteredStandups = standups.filter(standup => {
    const query = searchQuery.toLowerCase();
    return (
      standup.transcriptArchive?.transcript?.toLowerCase().includes(query) ||
      standup.participants.some(p => 
        p.user.name.toLowerCase().includes(query)
      ) ||
      format(standup.date, 'PPP').toLowerCase().includes(query)
    );
  });

  const toggleExpanded = (standupId: string) => {
    setExpandedStandupId(expandedStandupId === standupId ? null : standupId);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="search"
          placeholder="Search standups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Standup List */}
      <div className="space-y-3">
        {filteredStandups.length === 0 ? (
          <Card className="p-6">
            <div className="text-center">
              <FileAudio className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No standups found matching your search.' : 'No standups recorded yet.'}
              </p>
            </div>
          </Card>
        ) : (
          filteredStandups.map((standup) => (
            <Card
              key={standup.id}
              className={cn(
                'overflow-hidden transition-all',
                selectedStandupId === standup.id && 'ring-2 ring-blue-500'
              )}
            >
              {/* Standup Header */}
              <div
                className={cn(
                  'cursor-pointer p-4',
                  expandedStandupId === standup.id && 'border-b border-gray-200 dark:border-gray-700'
                )}
                onClick={() => onStandupSelect?.(standup)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Date and Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{format(standup.date, 'PPP')}</span>
                      <span className="text-gray-400">•</span>
                      <Clock className="h-4 w-4" />
                      <span>{format(standup.date, 'p')}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-3">
                      {standup.participants.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {standup.participants.length} participants
                          </span>
                        </div>
                      )}
                      
                      {standup.actionItems.length > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Target className="h-3 w-3" />
                          {standup.actionItems.length} actions
                        </Badge>
                      )}
                      
                      {standup.blockers.length > 0 && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'gap-1',
                            standup.blockers.some(b => !b.resolved) 
                              ? 'border-red-600 text-red-600' 
                              : 'border-green-600 text-green-600'
                          )}
                        >
                          <AlertCircle className="h-3 w-3" />
                          {standup.blockers.length} blockers
                        </Badge>
                      )}
                      
                      {standup.decisions.length > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Lightbulb className="h-3 w-3" />
                          {standup.decisions.length} decisions
                        </Badge>
                      )}
                    </div>

                    {/* Transcript Preview */}
                    {standup.transcriptArchive?.transcript && (
                      <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {standup.transcriptArchive?.transcript}
                      </p>
                    )}
                  </div>

                  {/* Expand/Play Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(standup.id);
                    }}
                    className="ml-4"
                  >
                    {expandedStandupId === standup.id ? (
                      <ChevronRight className="h-4 w-4 rotate-90 transition-transform" />
                    ) : standup.audioUrl ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedStandupId === standup.id && (
                <div className="p-4 pt-0">
                  {/* Audio Player */}
                  {standup.audioUrl && (
                    <div className="mb-4">
                      <AudioControls
                        audioUrl={standup.audioUrl}
                        showSpeed
                      />
                    </div>
                  )}

                  {/* Full Transcript */}
                  {standup.transcriptArchive?.transcript && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                      <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Full Transcript
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {standup.transcriptArchive?.transcript}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Standup Summary Card Component
export function StandupSummaryCard({
  standup,
  onClick,
  isSelected = false,
  className,
}: {
  standup: StandupWithRelations;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}) {
  const completedActionItems = standup.actionItems.filter(item => item.completed).length;
  const resolvedBlockers = standup.blockers.filter(blocker => blocker.resolved).length;

  return (
    <Card
      className={cn(
        'cursor-pointer p-4 transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500',
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{format(standup.date, 'MMM d, yyyy')}</span>
          </div>
          {standup.audioUrl && <FileAudio className="h-4 w-4 text-gray-400" />}
        </div>

        {/* Participants */}
        {standup.participants.length > 0 && (
          <div className="flex -space-x-2">
            {standup.participants.slice(0, 4).map((participant) => (
              <div
                key={participant.id}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-medium text-white dark:border-gray-900"
                title={participant.user.name}
              >
                {participant.user.initials}
              </div>
            ))}
            {standup.participants.length > 4 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium text-gray-600 dark:border-gray-900 dark:bg-gray-700 dark:text-gray-400">
                +{standup.participants.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {standup.actionItems.length}
            </div>
            <div className="text-xs text-gray-500">Actions</div>
            {completedActionItems > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400">
                {completedActionItems} done
              </div>
            )}
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {standup.blockers.length}
            </div>
            <div className="text-xs text-gray-500">Blockers</div>
            {resolvedBlockers > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400">
                {resolvedBlockers} resolved
              </div>
            )}
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {standup.decisions.length}
            </div>
            <div className="text-xs text-gray-500">Decisions</div>
          </div>
        </div>
      </div>
    </Card>
  );
}