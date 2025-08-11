'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit3, Lock, Unlock, Users, AlertCircle, 
  CheckCircle, XCircle, Clock, Loader2, Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from './presence-system';

export interface EditSession {
  id: string;
  fieldId: string;
  recordId: string;
  user: User;
  startedAt: Date;
  lastActivity: Date;
  changes?: any;
  locked?: boolean;
}

export interface CollaborativeEditorProps {
  fieldId: string;
  recordId: string;
  currentUser: User;
  editSessions: EditSession[];
  value: any;
  onChange: (value: any) => void;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
  onSave?: (value: any) => Promise<void>;
  lockTimeout?: number; // ms
  showConflictResolution?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number; // ms
  children: React.ReactNode;
  className?: string;
}

type EditorState = 'idle' | 'editing' | 'saving' | 'locked' | 'conflict';

interface ConflictData {
  localValue: any;
  remoteValue: any;
  remoteUser: User;
  timestamp: Date;
}

export function CollaborativeEditor({
  fieldId,
  recordId,
  currentUser,
  editSessions,
  value,
  onChange,
  onStartEdit,
  onEndEdit,
  onSave,
  lockTimeout = 30000,
  showConflictResolution = true,
  autoSave = true,
  autoSaveDelay = 2000,
  children,
  className,
}: CollaborativeEditorProps) {
  const [state, setState] = useState<EditorState>('idle');
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  const [conflict, setConflict] = useState<ConflictData | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lockTimeoutRef = useRef<NodeJS.Timeout>();

  const activeSession = editSessions.find(
    s => s.fieldId === fieldId && s.recordId === recordId
  );
  
  const isLocked = activeSession && activeSession.user.id !== currentUser.id;
  const otherEditors = editSessions.filter(
    s => s.fieldId === fieldId && s.recordId === recordId && s.user.id !== currentUser.id
  );

  // Handle value changes from parent
  useEffect(() => {
    if (value !== localValue && state !== 'editing') {
      setLocalValue(value);
    }
  }, [value, localValue, state]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !hasChanges || !onSave) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, autoSaveDelay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [localValue, hasChanges, autoSave, autoSaveDelay]);

  // Lock timeout
  useEffect(() => {
    if (state !== 'editing') return;

    const resetLock = () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }

      lockTimeoutRef.current = setTimeout(() => {
        handleEndEdit();
      }, lockTimeout);
    };

    resetLock();

    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
    };
  }, [state, localValue, lockTimeout]);

  const handleStartEdit = () => {
    if (isLocked) {
      setState('locked');
      return;
    }

    setState('editing');
    onStartEdit?.();
  };

  const handleEndEdit = () => {
    if (hasChanges && onSave) {
      handleSave();
    }
    setState('idle');
    setHasChanges(false);
    onEndEdit?.();
  };

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    setHasChanges(true);
    onChange(newValue);
  };

  const handleSave = async () => {
    if (!onSave) return;

    setState('saving');
    try {
      await onSave(localValue);
      setLastSaved(new Date());
      setHasChanges(false);
      setState('idle');
    } catch (error) {
      console.error('Save failed:', error);
      setState('editing');
    }
  };

  const handleConflictResolve = (resolution: 'local' | 'remote' | 'merge') => {
    if (!conflict) return;

    switch (resolution) {
      case 'local':
        // Keep local changes
        handleSave();
        break;
      case 'remote':
        // Accept remote changes
        setLocalValue(conflict.remoteValue);
        onChange(conflict.remoteValue);
        setHasChanges(false);
        break;
      case 'merge':
        // Custom merge logic would go here
        break;
    }

    setConflict(null);
    setState('idle');
  };

  const EditorIndicator = () => {
    if (otherEditors.length === 0 && state !== 'editing') return null;

    return (
      <div className="absolute -top-2 -right-2 z-10">
        <AnimatePresence>
          {state === 'editing' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs"
            >
              <Edit3 className="h-3 w-3" />
              Editing
            </motion.div>
          )}
          
          {otherEditors.map((session) => (
            <motion.div
              key={session.user.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs"
              style={{ 
                backgroundColor: session.user.color + '20',
                color: session.user.color,
                border: `1px solid ${session.user.color}`,
              }}
            >
              <Avatar className="h-4 w-4">
                <AvatarImage src={session.user.avatar} />
                <AvatarFallback className="text-[8px]">
                  {session.user.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">{session.user.name.split(' ')[0]}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const SaveIndicator = () => {
    if (!autoSave || state !== 'editing') return null;

    return (
      <div className="absolute -bottom-6 left-0 z-10">
        <AnimatePresence mode="wait">
          {state === 'saving' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </motion.div>
          )}
          
          {hasChanges && state === 'editing' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Clock className="h-3 w-3" />
              Unsaved changes
            </motion.div>
          )}
          
          {lastSaved && !hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 text-xs text-green-600"
            >
              <CheckCircle className="h-3 w-3" />
              Saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const LockOverlay = () => {
    if (!isLocked) return null;

    return (
      <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm z-20 flex items-center justify-center rounded">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex flex-col items-center gap-2 p-4">
                <Lock className="h-6 w-6 text-gray-400" />
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activeSession?.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {activeSession?.user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {activeSession?.user.name} is editing
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Started {activeSession && new Date(activeSession.startedAt).toLocaleTimeString()}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const ConflictResolution = () => {
    if (!conflict || !showConflictResolution) return null;

    return (
      <div className="absolute inset-0 bg-white dark:bg-gray-900 z-30 rounded border-2 border-yellow-500 p-4">
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{conflict.remoteUser.name}</strong> made changes while you were editing.
            Choose how to resolve the conflict:
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleConflictResolve('local')}
          >
            <Save className="h-4 w-4 mr-2" />
            Keep my changes
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleConflictResolve('remote')}
          >
            <Users className="h-4 w-4 mr-2" />
            Accept {conflict.remoteUser.name}'s changes
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            disabled
            onClick={() => handleConflictResolve('merge')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Merge changes (Coming soon)
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={cn("relative", className)}
      onFocus={handleStartEdit}
      onBlur={() => {
        if (state === 'editing' && !hasChanges) {
          handleEndEdit();
        }
      }}
    >
      <EditorIndicator />
      <SaveIndicator />
      <LockOverlay />
      <ConflictResolution />
      
      <div className={cn(
        "transition-all",
        isLocked && "opacity-50 pointer-events-none",
        state === 'conflict' && "ring-2 ring-yellow-500",
        state === 'editing' && "ring-2 ring-blue-500",
        otherEditors.length > 0 && state !== 'editing' && "ring-1",
        otherEditors.length > 0 && `ring-opacity-50`
      )}
      style={{
        ringColor: otherEditors[0]?.user.color,
      }}>
        {React.cloneElement(children as React.ReactElement, {
          value: localValue,
          onChange: handleChange,
          disabled: isLocked || state === 'conflict',
        })}
      </div>
    </div>
  );
}