'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, ChevronDown, Settings, 
  Users, Activity, Star, Clock, ChevronRight,
  FolderOpen, Database, Grid3x3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Workspace {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  memberCount: number;
  projectCount: number;
  lastAccessed?: Date;
  isPinned?: boolean;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

interface WorkspaceSwitcherProps {
  currentWorkspace?: Workspace;
  workspaces?: Workspace[];
  onWorkspaceChange?: (workspace: Workspace) => void;
  onCreateWorkspace?: () => void;
  className?: string;
}

export function WorkspaceSwitcher({
  currentWorkspace,
  workspaces = [],
  onWorkspaceChange,
  onCreateWorkspace,
  className
}: WorkspaceSwitcherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pinnedWorkspaces, setPinnedWorkspaces] = useState<string[]>([]);
  
  // Default workspace if none provided
  const defaultWorkspace: Workspace = {
    id: 'default',
    name: 'LabSync Research',
    isActive: true,
    memberCount: 12,
    projectCount: 45,
    role: 'owner',
    isPinned: true,
  };
  
  const activeWorkspace = currentWorkspace || defaultWorkspace;
  
  // Sample workspaces if none provided
  const allWorkspaces = workspaces.length > 0 ? workspaces : [
    defaultWorkspace,
    {
      id: 'health-equity',
      name: 'Health Equity Lab',
      isActive: false,
      memberCount: 8,
      projectCount: 23,
      role: 'admin' as const,
      lastAccessed: new Date('2024-01-10'),
    },
    {
      id: 'clinical-trials',
      name: 'Clinical Trials Unit',
      isActive: false,
      memberCount: 15,
      projectCount: 67,
      role: 'member' as const,
      lastAccessed: new Date('2024-01-08'),
    },
    {
      id: 'bioinformatics',
      name: 'Bioinformatics Core',
      isActive: false,
      memberCount: 6,
      projectCount: 34,
      role: 'viewer' as const,
      lastAccessed: new Date('2024-01-05'),
    },
  ];
  
  // Filter workspaces based on search
  const filteredWorkspaces = allWorkspaces.filter(ws => 
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Separate pinned and recent workspaces
  const pinnedWs = filteredWorkspaces.filter(ws => 
    pinnedWorkspaces.includes(ws.id) || ws.isPinned
  );
  const recentWs = filteredWorkspaces.filter(ws => 
    !pinnedWorkspaces.includes(ws.id) && !ws.isPinned
  ).sort((a, b) => {
    const dateA = a.lastAccessed?.getTime() || 0;
    const dateB = b.lastAccessed?.getTime() || 0;
    return dateB - dateA;
  });
  
  const handlePinWorkspace = (workspaceId: string) => {
    setPinnedWorkspaces(prev => 
      prev.includes(workspaceId) 
        ? prev.filter(id => id !== workspaceId)
        : [...prev, workspaceId]
    );
  };
  
  const getRoleColor = (role: Workspace['role']) => {
    const colors = {
      owner: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950',
      admin: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
      member: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950',
      viewer: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950',
    };
    return colors[role];
  };
  
  const getRoleIcon = (role: Workspace['role']) => {
    const icons = {
      owner: '👑',
      admin: '⚡',
      member: '👤',
      viewer: '👁️',
    };
    return icons[role];
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("gap-2 px-3", className)}
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold",
              activeWorkspace.color ? `bg-${activeWorkspace.color}-500` : "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
            )}>
              {activeWorkspace.icon || activeWorkspace.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold max-w-[150px] truncate">
              {activeWorkspace.name}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[320px]">
        {/* Current Workspace Header */}
        <div className="px-3 py-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-md flex items-center justify-center text-sm font-bold",
                activeWorkspace.color ? `bg-${activeWorkspace.color}-500` : "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
              )}>
                {activeWorkspace.icon || activeWorkspace.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{activeWorkspace.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {activeWorkspace.memberCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Grid3x3 className="h-3 w-3" />
                    {activeWorkspace.projectCount}
                  </span>
                  <Badge variant="secondary" className={cn("text-[10px] px-1", getRoleColor(activeWorkspace.role))}>
                    {getRoleIcon(activeWorkspace.role)} {activeWorkspace.role}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handlePinWorkspace(activeWorkspace.id)}
            >
              <Star className={cn(
                "h-3.5 w-3.5",
                (pinnedWorkspaces.includes(activeWorkspace.id) || activeWorkspace.isPinned) && "fill-yellow-400 text-yellow-400"
              )} />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearching(true)}
              onBlur={() => setTimeout(() => setIsSearching(false), 200)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        
        {/* Workspaces List */}
        <ScrollArea className="h-[300px]">
          {pinnedWs.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                PINNED
              </DropdownMenuLabel>
              {pinnedWs.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => onWorkspaceChange?.(workspace)}
                  className="px-2 py-1.5"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold",
                        workspace.color ? `bg-${workspace.color}-500` : "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                      )}>
                        {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{workspace.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{workspace.memberCount} members</span>
                          <span>•</span>
                          <span>{workspace.projectCount} projects</span>
                        </div>
                      </div>
                    </div>
                    {workspace.isActive && (
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          {recentWs.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                RECENT
              </DropdownMenuLabel>
              {recentWs.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => onWorkspaceChange?.(workspace)}
                  className="px-2 py-1.5"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold",
                        workspace.color ? `bg-${workspace.color}-500` : "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                      )}>
                        {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{workspace.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{workspace.memberCount} members</span>
                          <span>•</span>
                          <span>{workspace.projectCount} projects</span>
                        </div>
                      </div>
                    </div>
                    {workspace.isActive && (
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          {filteredWorkspaces.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No workspaces found
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        
        {/* Quick Actions */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Settings className="h-4 w-4 mr-2" />
              Workspace settings
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                Members & permissions
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Database className="h-4 w-4 mr-2" />
                Data & storage
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Activity className="h-4 w-4 mr-2" />
                Activity log
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuItem onClick={onCreateWorkspace}>
            <Plus className="h-4 w-4 mr-2" />
            Create workspace
            <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <FolderOpen className="h-4 w-4 mr-2" />
            Browse all workspaces
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}