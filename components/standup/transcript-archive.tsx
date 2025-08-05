'use client';

import { useState, useEffect } from 'react';
import { 
  Archive, 
  Calendar, 
  Download, 
  Search, 
  AlertCircle,
  Clock,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { showToast } from '@/components/ui/toast';
import { format, formatDistanceToNow, addDays } from 'date-fns';

// Helper function to calculate days until expiry
const getDaysUntilExpiry = (expiresAt: string) => {
  const expiryDate = new Date(expiresAt);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

interface TranscriptArchiveItem {
  id: string;
  standupId: string;
  transcript: string;
  audioUrl?: string | null;
  wordCount: number;
  duration?: number | null;
  language: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  standup: {
    date: string;
    lab: {
      name: string;
    };
  };
}

interface TranscriptArchiveProps {
  labId?: string;
  className?: string;
}

export function TranscriptArchive({ labId, className }: TranscriptArchiveProps) {
  const [transcripts, setTranscripts] = useState<TranscriptArchiveItem[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<TranscriptArchiveItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Load expiring soon transcripts on mount
  useEffect(() => {
    loadExpiringSoon();
    loadStats();
  }, [labId]);

  const loadExpiringSoon = async () => {
    try {
      const params = new URLSearchParams({
        expiringSoon: 'true',
        days: '7',
        ...(labId && { labId }),
      });
      const response = await fetch(`/api/transcripts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setExpiringSoon(data);
      }
    } catch (error) {
      console.error('Failed to load expiring transcripts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = labId ? `?labId=${labId}` : '';
      const response = await fetch(`/api/transcripts/stats${params}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const searchTranscripts = async () => {
    if (!searchQuery.trim()) {
      setTranscripts([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        ...(labId && { labId }),
      });
      const response = await fetch(`/api/transcripts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTranscripts(data);
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Search failed',
        message: 'Unable to search transcripts',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleExport = async (standupId: string) => {
    try {
      const response = await fetch(`/api/transcripts/${standupId}/export`);
      if (response.ok) {
        // Create a blob from the response
        const blob = await response.blob();
        const filename = response.headers.get('content-disposition')
          ?.split('filename=')[1]
          ?.replace(/"/g, '') || 'transcript.txt';
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast({
          type: 'success',
          title: 'Transcript exported',
          message: 'The transcript has been downloaded',
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Export failed',
        message: 'Unable to export transcript',
      });
    }
  };

  const handleExtendRetention = async (standupId: string, days: number = 30) => {
    try {
      const response = await fetch(`/api/transcripts/${standupId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      
      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Retention extended',
          message: `Transcript retention extended by ${days} days`,
        });
        loadExpiringSoon();
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Extension failed',
        message: 'Unable to extend retention period',
      });
    }
  };

  const handleDelete = async (standupId: string) => {
    if (!confirm('Are you sure you want to delete this transcript? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/transcripts/${standupId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Transcript deleted',
          message: 'The transcript has been permanently deleted',
        });
        loadExpiringSoon();
        // Remove from search results if present
        setTranscripts(prev => prev.filter(t => t.standupId !== standupId));
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Delete failed',
        message: 'Unable to delete transcript',
      });
    }
  };

  return (
    <div className={className}>
      {/* Stats Overview */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalTranscripts}</p>
                <p className="text-sm text-gray-500">Total Transcripts</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalWords.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Words</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/20">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.expiringWithin7Days}</p>
                <p className="text-sm text-gray-500">Expiring Soon</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {format(new Date(stats.oldestTranscript), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-500">Oldest Transcript</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search Section */}
      <Card className="mb-6 p-4">
        <h3 className="mb-4 text-lg font-medium">Search Transcripts</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchTranscripts()}
              placeholder="Search transcript content..."
              className="pl-10"
            />
          </div>
          <Button onClick={searchTranscripts} disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        {transcripts.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search Results ({transcripts.length})
            </h4>
            {transcripts.map((transcript) => (
              <TranscriptCard
                key={transcript.id}
                transcript={transcript}
                onExport={handleExport}
                onExtend={handleExtendRetention}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Expiring Soon Section */}
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Expiring Soon</h3>
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {expiringSoon.length} transcripts
          </Badge>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Loading transcripts...
          </div>
        ) : expiringSoon.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No transcripts expiring in the next 7 days
          </div>
        ) : (
          <div className="space-y-2">
            {expiringSoon.map((transcript) => (
              <TranscriptCard
                key={transcript.id}
                transcript={transcript}
                onExport={handleExport}
                onExtend={handleExtendRetention}
                onDelete={handleDelete}
                showExpiryWarning
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Transcript Card Component
function TranscriptCard({
  transcript,
  onExport,
  onExtend,
  onDelete,
  showExpiryWarning = false,
}: {
  transcript: TranscriptArchiveItem;
  onExport: (standupId: string) => void;
  onExtend: (standupId: string, days?: number) => void;
  onDelete: (standupId: string) => void;
  showExpiryWarning?: boolean;
}) {
  const daysUntilExpiry = getDaysUntilExpiry(transcript.expiresAt);
  const isExpiringSoon = daysUntilExpiry <= 7;
  const isExpired = daysUntilExpiry < 0;

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">
              Standup - {format(new Date(transcript.standup.date), 'MMM d, yyyy')}
            </h4>
            {showExpiryWarning && isExpiringSoon && !isExpired && (
              <Badge variant="warning" className="text-xs">
                Expires in {daysUntilExpiry} days
              </Badge>
            )}
            {isExpired && (
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {transcript.standup.lab.name} • {transcript.wordCount} words
            {transcript.duration && ` • ${Math.floor(transcript.duration / 60)}m ${transcript.duration % 60}s`}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
            {transcript.transcript.substring(0, 200)}...
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport(transcript.standupId)}>
              <Download className="mr-2 h-4 w-4" />
              Export Transcript
            </DropdownMenuItem>
            {!isExpired && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onExtend(transcript.standupId, 30)}>
                  <Clock className="mr-2 h-4 w-4" />
                  Extend 30 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExtend(transcript.standupId, 90)}>
                  <Clock className="mr-2 h-4 w-4" />
                  Extend 90 Days
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(transcript.standupId)}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Transcript
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}