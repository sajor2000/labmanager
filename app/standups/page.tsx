'use client';

import { useState, useEffect } from 'react';
import { Plus, Mic, History, BarChart3, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { StandupRecorder } from '@/components/standup/standup-recorder';
import { StandupHistory } from '@/components/standup/standup-history';
import { AnalysisResults } from '@/components/standup/analysis-results';
import { TranscriptDisplay } from '@/components/standup/transcript-display';
import { TranscriptArchive } from '@/components/standup/transcript-archive';
import { SendEmailModal } from '@/components/standup/send-email-modal';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useLab } from '@/lib/contexts/lab-context';
import {
  createStandupAction,
  getStandupsByLabAction,
  getStandupStatsAction,
  updateActionItemStatusAction,
  updateBlockerStatusAction,
} from '@/app/actions/standup.actions';
import type { StandupWithRelations } from '@/lib/services/standup.service';

export default function StandupsPage() {
  const { user } = useCurrentUser();
  const { currentLab, isLoading: labLoading } = useLab();
  const [isRecording, setIsRecording] = useState(false);
  const [currentStandupId, setCurrentStandupId] = useState<string | null>(null);
  const [selectedStandup, setSelectedStandup] = useState<StandupWithRelations | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<string>('');
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [standups, setStandups] = useState<StandupWithRelations[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Load standups when lab changes
  useEffect(() => {
    if (currentLab && !labLoading) {
      loadStandups();
      loadStats();
    }
  }, [currentLab, labLoading]);

  const loadStandups = async () => {
    if (!currentLab) return;
    setIsLoading(true);
    try {
      const result = await getStandupsByLabAction(currentLab.id);
      if (result.success && result.data) {
        setStandups(result.data);
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to load standups',
        message: 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      if (!currentLab) return;
      const result = await getStandupStatsAction(currentLab.id);
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleStartRecording = async () => {
    if (!currentLab) {
      console.error('No lab selected');
      return;
    }
    try {
      const result = await createStandupAction({
        labId: currentLab.id,
      });

      if (result.success && result.data) {
        setCurrentStandupId(result.data.id);
        setIsRecording(true);
      } else {
        showToast({
          type: 'error',
          title: 'Failed to create standup',
          message: result.error,
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to start recording',
      });
    }
  };

  const handleRecordingComplete = async () => {
    setIsRecording(false);
    setCurrentStandupId(null);
    await loadStandups();
    await loadStats();
  };

  const handleActionItemToggle = async (actionItemId: string, completed: boolean) => {
    try {
      const result = await updateActionItemStatusAction(actionItemId, completed);
      if (result.success) {
        await loadStandups();
        // Update selected standup if it's the one being modified
        if (selectedStandup) {
          const updated = standups.find(s => s.id === selectedStandup.id);
          if (updated) {
            setSelectedStandup(updated);
          }
        }
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to update action item',
        message: 'Please try again',
      });
    }
  };

  const handleBlockerToggle = async (blockerId: string, resolved: boolean) => {
    try {
      const result = await updateBlockerStatusAction(blockerId, resolved);
      if (result.success) {
        await loadStandups();
        // Update selected standup if it's the one being modified
        if (selectedStandup) {
          const updated = standups.find(s => s.id === selectedStandup.id);
          if (updated) {
            setSelectedStandup(updated);
          }
        }
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to update blocker',
        message: 'Please try again',
      });
    }
  };

  // Load transcript from archive when standup is selected
  useEffect(() => {
    if (selectedStandup?.id) {
      loadTranscript(selectedStandup.id);
    } else {
      setSelectedTranscript('');
    }
  }, [selectedStandup?.id]);

  const loadTranscript = async (standupId: string) => {
    setIsLoadingTranscript(true);
    try {
      const response = await fetch(`/api/transcripts/${standupId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTranscript(data.transcript || '');
      } else {
        setSelectedTranscript('');
      }
    } catch (error) {
      console.error('Failed to load transcript:', error);
      setSelectedTranscript('');
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Standups</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AI-powered meeting capture and action extraction
          </p>
        </div>
        {!isRecording && (
          <Button onClick={handleStartRecording} className="gap-2">
            <Plus className="h-4 w-4" />
            New Standup
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalStandups}</p>
                <p className="text-sm text-gray-500">Total Standups</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalActionItems}</p>
                <p className="text-sm text-gray-500">Action Items</p>
                <p className="text-xs text-green-600">{stats.completedActionItems} completed</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/20">
                <History className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalBlockers}</p>
                <p className="text-sm text-gray-500">Blockers</p>
                <p className="text-xs text-green-600">{stats.resolvedBlockers} resolved</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {stats.averageActionItemsPerStandup.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">Avg Actions/Standup</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {isRecording && currentStandupId ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <StandupRecorder
            standupId={currentStandupId}
            onRecordingComplete={handleRecordingComplete}
          />
          <div className="space-y-6">
            <TranscriptDisplay transcript="" isLoading />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history">Recent Standups</TabsTrigger>
            <TabsTrigger value="current" disabled={!selectedStandup}>
              Current Standup
            </TabsTrigger>
            <TabsTrigger value="archive">Transcript Archive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-4">
            <StandupHistory
              standups={standups}
              onStandupSelect={setSelectedStandup}
              selectedStandupId={selectedStandup?.id}
            />
          </TabsContent>
          
          <TabsContent value="current" className="space-y-4">
            {selectedStandup && (
              <>
                {/* Send Email Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowEmailModal(true)}
                    className="gap-2"
                    disabled={
                      !selectedStandup.audioUrl || 
                      selectedStandup.actionItems.length === 0
                    }
                  >
                    <Send className="h-4 w-4" />
                    Send Meeting Notes
                  </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h3 className="mb-2 font-medium">Transcript</h3>
                      <TranscriptDisplay
                        transcript={selectedTranscript}
                        isLoading={isLoadingTranscript}
                        showCopyButton
                      />
                    </Card>
                  </div>
                  <AnalysisResults
                    summary=""
                    actionItems={selectedStandup.actionItems}
                    blockers={selectedStandup.blockers}
                    decisions={selectedStandup.decisions}
                    participants={selectedStandup.participants}
                    onActionItemToggle={handleActionItemToggle}
                    onBlockerToggle={handleBlockerToggle}
                  />
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="archive" className="space-y-4">
            <TranscriptArchive labId={currentLab?.id || undefined} />
          </TabsContent>
        </Tabs>
      )}

      {/* Email Modal */}
      {selectedStandup && user && (
        <SendEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          standup={selectedStandup}
          currentUser={{ name: user.name, email: user.email }}
        />
      )}
    </div>
  );
}