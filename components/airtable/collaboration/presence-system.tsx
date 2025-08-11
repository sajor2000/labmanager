'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Circle, Edit3, Eye, MousePointer, 
  MessageSquare, Lock, Clock, Wifi, WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  status?: 'active' | 'idle' | 'offline';
  lastSeen?: Date;
}

export interface PresenceData {
  user: User;
  cursor?: { x: number; y: number };
  selection?: { recordId: string; fieldId?: string };
  viewport?: { top: number; left: number; width: number; height: number };
  activity?: {
    type: 'viewing' | 'editing' | 'commenting' | 'filtering' | 'sorting';
    target?: string;
    timestamp: Date;
  };
  isTyping?: boolean;
  device?: 'desktop' | 'tablet' | 'mobile';
}

interface PresenceSystemProps {
  currentUser: User;
  presenceData: PresenceData[];
  onPresenceUpdate?: (data: Partial<PresenceData>) => void;
  maxVisible?: number;
  showCursors?: boolean;
  showActivity?: boolean;
  showViewports?: boolean;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  className?: string;
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#5A67D8',
  '#ED8936', '#48BB78', '#38B2AC', '#9F7AEA', '#F687B3',
];

const ACTIVITY_ICONS = {
  viewing: <Eye className="h-3 w-3" />,
  editing: <Edit3 className="h-3 w-3" />,
  commenting: <MessageSquare className="h-3 w-3" />,
  filtering: <Circle className="h-3 w-3" />,
  sorting: <Circle className="h-3 w-3" />,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function PresenceSystem({
  currentUser,
  presenceData,
  onPresenceUpdate,
  maxVisible = 5,
  showCursors = true,
  showActivity = true,
  showViewports = false,
  connectionStatus = 'connected',
  className,
}: PresenceSystemProps) {
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track mouse movement
  useEffect(() => {
    if (!showCursors || !onPresenceUpdate) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setMousePosition(pos);
      
      // Throttle updates
      if (Math.random() > 0.9) {
        onPresenceUpdate({ cursor: pos });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showCursors, onPresenceUpdate]);

  // Track user activity
  useEffect(() => {
    if (!onPresenceUpdate) return;

    const handleActivity = () => {
      onPresenceUpdate({
        activity: {
          type: 'viewing',
          timestamp: new Date(),
        },
      });
    };

    const interval = setInterval(handleActivity, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [onPresenceUpdate]);

  const activeUsers = presenceData.filter(p => p.user.status !== 'offline');
  const visibleUsers = showAllUsers ? activeUsers : activeUsers.slice(0, maxVisible);
  const hiddenCount = activeUsers.length - maxVisible;

  const ConnectionIndicator = () => {
    const statusConfig = {
      connected: { icon: <Wifi className="h-3 w-3" />, color: 'text-green-500', label: 'Connected' },
      connecting: { icon: <Clock className="h-3 w-3 animate-pulse" />, color: 'text-yellow-500', label: 'Connecting...' },
      disconnected: { icon: <WifiOff className="h-3 w-3" />, color: 'text-red-500', label: 'Disconnected' },
    };

    const config = statusConfig[connectionStatus];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1", config.color)}>
              {config.icon}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{config.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const UserAvatar = ({ presence, size = 'sm' }: { presence: PresenceData; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    return (
      <div className="relative">
        <Avatar className={cn(sizeClasses[size], "border-2")} style={{ borderColor: presence.user.color }}>
          <AvatarImage src={presence.user.avatar} alt={presence.user.name} />
          <AvatarFallback style={{ backgroundColor: presence.user.color + '20', color: presence.user.color }}>
            {getInitials(presence.user.name)}
          </AvatarFallback>
        </Avatar>
        
        {/* Status indicator */}
        <div 
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800",
            presence.user.status === 'active' && "bg-green-500",
            presence.user.status === 'idle' && "bg-yellow-500",
            presence.user.status === 'offline' && "bg-gray-400"
          )}
        />
        
        {/* Activity indicator */}
        {presence.isTyping && (
          <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
            <Edit3 className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>
    );
  };

  const UserTooltip = ({ presence }: { presence: PresenceData }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <UserAvatar presence={presence} size="md" />
        <div>
          <p className="font-medium">{presence.user.name}</p>
          <p className="text-xs text-muted-foreground">{presence.user.email}</p>
        </div>
      </div>
      
      {presence.activity && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs">
            {ACTIVITY_ICONS[presence.activity.type]}
            <span className="capitalize">{presence.activity.type}</span>
            {presence.activity.target && (
              <span className="text-muted-foreground">• {presence.activity.target}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getRelativeTime(presence.activity.timestamp)}
          </p>
        </div>
      )}
      
      {presence.device && (
        <Badge variant="outline" className="text-xs">
          {presence.device}
        </Badge>
      )}
    </div>
  );

  return (
    <>
      <div ref={containerRef} className={cn("flex items-center gap-2", className)}>
        <ConnectionIndicator />
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
        
        <div className="flex items-center">
          <TooltipProvider>
            <div className="flex -space-x-2">
              {visibleUsers.map((presence) => (
                <Tooltip key={presence.user.id}>
                  <TooltipTrigger
                    onMouseEnter={() => setHoveredUser(presence.user.id)}
                    onMouseLeave={() => setHoveredUser(null)}
                  >
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      className="relative"
                    >
                      <UserAvatar presence={presence} />
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-3">
                    <UserTooltip presence={presence} />
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
          
          {hiddenCount > 0 && !showAllUsers && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 ml-1"
                >
                  <span className="text-xs">+{hiddenCount}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Active Users ({activeUsers.length})
                  </h4>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="p-4 space-y-3">
                    {activeUsers.map((presence) => (
                      <div
                        key={presence.user.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar presence={presence} />
                          <div>
                            <p className="text-sm font-medium">{presence.user.name}</p>
                            {presence.activity && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {ACTIVITY_ICONS[presence.activity.type]}
                                <span>{presence.activity.type}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {presence.user.lastSeen && (
                          <span className="text-xs text-muted-foreground">
                            {getRelativeTime(presence.user.lastSeen)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        <Badge variant="outline" className="ml-2">
          <Users className="h-3 w-3 mr-1" />
          {activeUsers.length}
        </Badge>
      </div>
      
      {/* Live Cursors */}
      {showCursors && (
        <AnimatePresence>
          {presenceData
            .filter(p => p.cursor && p.user.id !== currentUser.id)
            .map((presence) => (
              <motion.div
                key={presence.user.id}
                className="fixed pointer-events-none z-50"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  x: presence.cursor!.x,
                  y: presence.cursor!.y,
                }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
              >
                <div className="relative">
                  <MousePointer
                    className="h-4 w-4"
                    style={{ color: presence.user.color }}
                    fill={presence.user.color}
                  />
                  <div
                    className="absolute top-4 left-4 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
                    style={{ backgroundColor: presence.user.color }}
                  >
                    {presence.user.name}
                  </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      )}
      
      {/* Selection Highlights */}
      {showViewports && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {presenceData
            .filter(p => p.selection && p.user.id !== currentUser.id)
            .map((presence) => (
              <div
                key={presence.user.id}
                className="absolute border-2 rounded"
                style={{
                  borderColor: presence.user.color,
                  backgroundColor: presence.user.color + '10',
                }}
              />
            ))}
        </div>
      )}
    </>
  );
}