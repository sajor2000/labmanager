'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Plus, Edit3, Trash2, MessageSquare, 
  Users, Filter, Sort, Eye, Download, Upload,
  CheckCircle, XCircle, AlertCircle, Clock,
  ChevronDown, MoreHorizontal, Bookmark, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from './presence-system';

export type ActivityType = 
  | 'record_created'
  | 'record_updated'
  | 'record_deleted'
  | 'field_added'
  | 'field_removed'
  | 'comment_added'
  | 'mention'
  | 'view_created'
  | 'filter_applied'
  | 'sort_applied'
  | 'bulk_action'
  | 'import'
  | 'export'
  | 'share'
  | 'permission_change';

export interface Activity {
  id: string;
  type: ActivityType;
  user: User;
  timestamp: Date;
  description: string;
  details?: {
    recordId?: string;
    recordName?: string;
    fieldId?: string;
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
    comment?: string;
    affectedCount?: number;
    viewName?: string;
    filterCriteria?: any;
    sortCriteria?: any;
  };
  metadata?: {
    important?: boolean;
    grouped?: boolean;
    groupId?: string;
    mentions?: string[];
  };
}

interface ActivityFeedProps {
  activities: Activity[];
  currentUser: User;
  onActivityClick?: (activity: Activity) => void;
  onMentionClick?: (userId: string) => void;
  maxItems?: number;
  groupSimilar?: boolean;
  showFilters?: boolean;
  realtime?: boolean;
  className?: string;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  record_created: <Plus className="h-4 w-4" />,
  record_updated: <Edit3 className="h-4 w-4" />,
  record_deleted: <Trash2 className="h-4 w-4" />,
  field_added: <Plus className="h-4 w-4" />,
  field_removed: <Trash2 className="h-4 w-4" />,
  comment_added: <MessageSquare className="h-4 w-4" />,
  mention: <Users className="h-4 w-4" />,
  view_created: <Eye className="h-4 w-4" />,
  filter_applied: <Filter className="h-4 w-4" />,
  sort_applied: <Sort className="h-4 w-4" />,
  bulk_action: <CheckCircle className="h-4 w-4" />,
  import: <Upload className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
  share: <Users className="h-4 w-4" />,
  permission_change: <AlertCircle className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  record_created: 'text-green-600 bg-green-50 dark:bg-green-950',
  record_updated: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  record_deleted: 'text-red-600 bg-red-50 dark:bg-red-950',
  field_added: 'text-green-600 bg-green-50 dark:bg-green-950',
  field_removed: 'text-red-600 bg-red-50 dark:bg-red-950',
  comment_added: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  mention: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
  view_created: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950',
  filter_applied: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950',
  sort_applied: 'text-teal-600 bg-teal-50 dark:bg-teal-950',
  bulk_action: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
  import: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  export: 'text-gray-600 bg-gray-50 dark:bg-gray-950',
  share: 'text-pink-600 bg-pink-50 dark:bg-pink-950',
  permission_change: 'text-red-600 bg-red-50 dark:bg-red-950',
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

function groupActivities(activities: Activity[]): Activity[][] {
  const groups: Activity[][] = [];
  let currentGroup: Activity[] = [];
  let lastActivity: Activity | null = null;

  activities.forEach((activity) => {
    if (
      lastActivity &&
      activity.type === lastActivity.type &&
      activity.user.id === lastActivity.user.id &&
      activity.timestamp.getTime() - lastActivity.timestamp.getTime() < 60000 // Within 1 minute
    ) {
      currentGroup.push(activity);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [activity];
    }
    lastActivity = activity;
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export function ActivityFeed({
  activities,
  currentUser,
  onActivityClick,
  onMentionClick,
  maxItems = 50,
  groupSimilar = true,
  showFilters = true,
  realtime = false,
  className,
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<'all' | 'mentions' | 'important'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [newActivities, setNewActivities] = useState<Activity[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    if (filter === 'mentions') {
      return activity.metadata?.mentions?.includes(currentUser.id);
    }
    if (filter === 'important') {
      return activity.metadata?.important;
    }
    return true;
  });

  // Group activities if enabled
  const displayActivities = groupSimilar
    ? groupActivities(filteredActivities.slice(0, maxItems))
    : filteredActivities.slice(0, maxItems).map(a => [a]);

  // Handle realtime updates
  useEffect(() => {
    if (!realtime) return;

    // Simulated realtime update
    const interval = setInterval(() => {
      // Check for new activities
      const latestActivity = activities[0];
      if (latestActivity && !newActivities.find(a => a.id === latestActivity.id)) {
        setNewActivities(prev => [latestActivity, ...prev].slice(0, 5));
        
        // Auto-scroll to top if near top
        if (scrollRef.current && scrollRef.current.scrollTop < 100) {
          scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activities, newActivities, realtime]);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const ActivityItem = ({ activity, isGrouped = false }: { activity: Activity; isGrouped?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
        isGrouped && "ml-8 py-2"
      )}
      onClick={() => onActivityClick?.(activity)}
    >
      {!isGrouped && (
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
          ACTIVITY_COLORS[activity.type]
        )}>
          {ACTIVITY_ICONS[activity.type]}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Avatar className="h-5 w-5">
                <AvatarImage src={activity.user.avatar} />
                <AvatarFallback className="text-[10px]">
                  {activity.user.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{activity.user.name}</span>
              <span className="text-sm text-muted-foreground">{activity.description}</span>
            </div>
            
            {activity.details && (
              <div className="mt-1 text-xs text-muted-foreground">
                {activity.details.recordName && (
                  <span className="font-medium">{activity.details.recordName}</span>
                )}
                {activity.details.fieldName && (
                  <span> • {activity.details.fieldName}</span>
                )}
                {activity.details.oldValue !== undefined && activity.details.newValue !== undefined && (
                  <span>
                    : <span className="line-through">{String(activity.details.oldValue)}</span>
                    {' → '}
                    <span className="font-medium">{String(activity.details.newValue)}</span>
                  </span>
                )}
                {activity.details.comment && (
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                    "{activity.details.comment}"
                  </div>
                )}
                {activity.details.affectedCount && (
                  <Badge variant="secondary" className="ml-2">
                    {activity.details.affectedCount} items
                  </Badge>
                )}
              </div>
            )}
            
            {activity.metadata?.mentions && activity.metadata.mentions.length > 0 && (
              <div className="flex gap-1 mt-1">
                {activity.metadata.mentions.map((userId) => (
                  <Badge
                    key={userId}
                    variant="outline"
                    className="text-xs cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMentionClick?.(userId);
                    }}
                  >
                    @{userId}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(activity.timestamp)}
            </span>
            {activity.metadata?.important && (
              <Bookmark className="h-3 w-3 text-yellow-500" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Mark as important
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="h-4 w-4 mr-2" />
                  Mute notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Hide this activity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Feed
            </CardTitle>
            <CardDescription>
              Recent changes and updates
            </CardDescription>
          </div>
          {realtime && (
            <Badge variant="outline" className="animate-pulse">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {showFilters && (
          <div className="px-6 pb-4">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Activity</TabsTrigger>
                <TabsTrigger value="mentions">Mentions</TabsTrigger>
                <TabsTrigger value="important">Important</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        
        <ScrollArea ref={scrollRef} className="h-[400px]">
          <div className="px-6 pb-4">
            <AnimatePresence>
              {displayActivities.map((group, groupIndex) => {
                const groupId = `${group[0].id}-group`;
                const isExpanded = expandedGroups.has(groupId);
                
                if (group.length === 1) {
                  return <ActivityItem key={group[0].id} activity={group[0]} />;
                }
                
                return (
                  <div key={groupId} className="mb-2">
                    <div
                      className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => toggleGroupExpansion(groupId)}
                    >
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          !isExpanded && "-rotate-90"
                        )} />
                      </Button>
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        ACTIVITY_COLORS[group[0].type]
                      )}>
                        {ACTIVITY_ICONS[group[0].type]}
                      </div>
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={group[0].user.avatar} />
                        <AvatarFallback className="text-[10px]">
                          {group[0].user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{group[0].user.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {group.length} actions
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatRelativeTime(group[0].timestamp)}
                      </span>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-1">
                        {group.map((activity) => (
                          <ActivityItem
                            key={activity.id}
                            activity={activity}
                            isGrouped
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </AnimatePresence>
            
            {filteredActivities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activity to show</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}