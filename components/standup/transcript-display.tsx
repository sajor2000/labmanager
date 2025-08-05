'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, Check, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TranscriptDisplayProps {
  transcript: string;
  isLoading?: boolean;
  showCopyButton?: boolean;
  autoScroll?: boolean;
  className?: string;
}

export function TranscriptDisplay({
  transcript,
  isLoading = false,
  showCopyButton = true,
  autoScroll = true,
  className,
}: TranscriptDisplayProps) {
  const [isCopied, setIsCopied] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (autoScroll && transcriptRef.current && transcript) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, autoScroll]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy transcript:', error);
    }
  };

  // Handle empty state
  if (!transcript && !isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            No transcript available yet.
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Start recording to see the transcript here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Transcript
        </h3>
        {showCopyButton && transcript && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-2 text-xs"
          >
            {isCopied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        )}
      </div>

      {/* Transcript content */}
      <div
        ref={transcriptRef}
        className="max-h-96 overflow-y-auto p-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Transcribing audio...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Format transcript into paragraphs */}
            {transcript.split('\n\n').map((paragraph, index) => (
              <p
                key={index}
                className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Word count footer */}
      {transcript && !isLoading && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {transcript.split(/\s+/).filter(Boolean).length} words •{' '}
            {transcript.length} characters
          </p>
        </div>
      )}
    </Card>
  );
}

// Utility component for real-time transcript
export function LiveTranscript({
  transcript,
  partialTranscript,
  className,
}: {
  transcript: string;
  partialTranscript?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript, partialTranscript]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900',
        className
      )}
    >
      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        {transcript}
        {partialTranscript && (
          <span className="text-gray-500 dark:text-gray-500">
            {' '}
            {partialTranscript}
          </span>
        )}
      </p>
      {(!transcript && !partialTranscript) && (
        <p className="text-sm text-gray-500 dark:text-gray-500 italic">
          Listening...
        </p>
      )}
    </div>
  );
}