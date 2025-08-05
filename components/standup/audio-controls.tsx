'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatRecordingTime } from '@/hooks/use-audio-recorder';

interface AudioControlsProps {
  audioUrl: string;
  className?: string;
  showVolumeControl?: boolean;
  showSpeed?: boolean;
}

export function AudioControls({
  audioUrl,
  className,
  showVolumeControl = true,
  showSpeed = false,
}: AudioControlsProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Update audio element when URL changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [audioUrl]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle restart
  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    if (isPlaying) {
      audioRef.current.play();
    }
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Handle playback speed
  const handleSpeedChange = () => {
    if (!audioRef.current) return;
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newRate = speeds[nextIndex];
    audioRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Progress bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 0}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatRecordingTime(Math.floor(currentTime))}</span>
          <span>{formatRecordingTime(Math.floor(duration))}</span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Restart button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRestart}
            className="h-8 w-8"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Play/Pause button */}
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayPause}
            className="h-10 w-10"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          {/* Speed control */}
          {showSpeed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSpeedChange}
              className="h-8 px-2 text-xs font-medium"
            >
              {playbackRate}x
            </Button>
          )}
        </div>

        {/* Volume control */}
        {showVolumeControl && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        )}
      </div>
    </div>
  );
}