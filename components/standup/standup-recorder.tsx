'use client';

import { useState, useCallback } from 'react';
import { Mic, MicOff, Pause, Play, Square, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioRecorder, formatRecordingTime, downloadAudioBlob } from '@/hooks/use-audio-recorder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { showToast } from '@/components/ui/toast';

interface StandupRecorderProps {
  standupId: string;
  onRecordingComplete?: (audioBlob: Blob, audioUrl: string) => void;
  onTranscriptUpdate?: (transcript: string) => void;
  className?: string;
}

export function StandupRecorder({
  standupId,
  onRecordingComplete,
  onTranscriptUpdate,
  className,
}: StandupRecorderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');

  const {
    isRecording,
    isPaused,
    recordingState,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    isSupported,
  } = useAudioRecorder({
    mimeType: 'audio/webm',
    onStop: async (blob, url) => {
      onRecordingComplete?.(blob, url);
      await processRecording(blob);
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: 'Recording Error',
        message: error.message,
      });
    },
  });

  // Process recording (transcribe and analyze)
  const processRecording = useCallback(async (blob: Blob) => {
    setIsProcessing(true);
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('audio', blob, `standup-${standupId}.webm`);

      // Call the process endpoint
      const response = await fetch(`/api/standups/${standupId}/process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process recording');
      }

      const result = await response.json();
      
      if (result.transcript) {
        setTranscript(result.transcript);
        onTranscriptUpdate?.(result.transcript);
      }

      showToast({
        type: 'success',
        title: 'Recording Processed',
        message: 'Your standup has been transcribed and analyzed successfully.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Processing Failed',
        message: error instanceof Error ? error.message : 'Failed to process recording',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [standupId, onTranscriptUpdate]);

  // Handle start recording
  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  // Handle download
  const handleDownload = () => {
    if (audioBlob) {
      const timestamp = new Date().toISOString().split('T')[0];
      downloadAudioBlob(audioBlob, `standup-${timestamp}.webm`);
    }
  };

  if (!isSupported) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <MicOff className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Audio recording is not supported in your browser.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Recording Status */}
        <div className="text-center">
          <div className="relative inline-flex">
            <div
              className={cn(
                'h-32 w-32 rounded-full border-4 flex items-center justify-center transition-colors',
                isRecording
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
              )}
            >
              {isRecording && !isPaused && (
                <div className="absolute inset-0 rounded-full animate-ping border-4 border-red-500 opacity-25" />
              )}
              <Mic
                className={cn(
                  'h-12 w-12 transition-colors',
                  isRecording
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-400 dark:text-gray-600'
                )}
              />
            </div>
          </div>

          {/* Recording Time */}
          {(isRecording || isPaused || recordingTime > 0) && (
            <div className="mt-4 text-2xl font-mono font-medium text-gray-900 dark:text-white">
              {formatRecordingTime(recordingTime)}
            </div>
          )}

          {/* Status Text */}
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {recordingState === 'idle' && 'Click to start recording'}
            {recordingState === 'recording' && 'Recording in progress...'}
            {recordingState === 'paused' && 'Recording paused'}
            {recordingState === 'stopped' && 'Recording complete'}
            {isProcessing && 'Processing your recording...'}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-2">
          {recordingState === 'idle' && (
            <Button
              onClick={handleStartRecording}
              size="lg"
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <>
              <Button
                onClick={pauseRecording}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button
                onClick={resumeRecording}
                size="lg"
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Resume
              </Button>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {recordingState === 'stopped' && audioBlob && !isProcessing && (
            <>
              <Button
                onClick={resetRecording}
                variant="outline"
                size="lg"
              >
                New Recording
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </>
          )}
        </div>

        {/* Audio Preview */}
        {audioUrl && !isProcessing && (
          <div className="mt-4">
            <audio
              controls
              src={audioUrl}
              className="w-full"
            />
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing your standup...
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error.message}
          </div>
        )}

        {/* Transcript Preview */}
        {transcript && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Transcript
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {transcript}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}