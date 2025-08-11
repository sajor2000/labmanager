'use client';

import React, { useState } from 'react';
import { 
  Menu, Search, Plus, Download, Upload, Grid3x3, 
  Kanban, Calendar, Gallery, FormInput, Timeline,
  Filter, ArrowUpDown, Palette, Share2, Settings2,
  Star, ChevronDown, Users, Eye, Lock, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

interface ViewConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

const viewTypes: ViewConfig[] = [
  { 
    id: 'grid', 
    name: 'Grid', 
    icon: <Grid3x3 className="h-4 w-4" />, 
    path: '/grid',
    description: 'Table view with sortable columns'
  },
  { 
    id: 'kanban', 
    name: 'Kanban', 
    icon: <Kanban className="h-4 w-4" />, 
    path: '/stacked',
    description: 'Card-based board view'
  },
  { 
    id: 'calendar', 
    name: 'Calendar', 
    icon: <Calendar className="h-4 w-4" />, 
    path: '/calendar',
    description: 'Date-based calendar view'
  },
  { 
    id: 'gallery', 
    name: 'Gallery', 
    icon: <Gallery className="h-4 w-4" />, 
    path: '/gallery',
    description: 'Visual card gallery'
  },
  { 
    id: 'form', 
    name: 'Form', 
    icon: <FormInput className="h-4 w-4" />, 
    path: '/form',
    description: 'Data entry form view'
  },
  { 
    id: 'timeline', 
    name: 'Timeline', 
    icon: <Timeline className="h-4 w-4" />, 
    path: '/timeline',
    description: 'Gantt chart timeline'
  },
];

interface AdvancedNavbarProps {
  workspaceName?: string;
  tableName?: string;
  viewName?: string;
  filterCount?: number;
  collaborators?: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  }>;
}

export function AdvancedNavbar({
  workspaceName = 'LabSync Research',
  tableName = 'Projects',
  viewName = 'All Projects',
  filterCount = 0,
  collaborators = []
}: AdvancedNavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // Determine current view type from pathname
  const currentViewType = viewTypes.find(v => pathname.includes(v.path)) || viewTypes[1]; // Default to Kanban

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-2">
        {/* Left Section */}
        <div className="flex items-center gap-2 flex-1">
          {/* Workspace Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Menu className="h-4 w-4" />
                <span className="font-semibold">{workspaceName}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[250px]">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  LabSync Research
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                  Health Equity Lab
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Create workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          {/* Table Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <span>{tableName}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <div className="px-2 py-1.5">
                <Input 
                  placeholder="Search tables..." 
                  className="h-8"
                />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Projects</DropdownMenuItem>
              <DropdownMenuItem>Tasks</DropdownMenuItem>
              <DropdownMenuItem>Team Members</DropdownMenuItem>
              <DropdownMenuItem>Ideas</DropdownMenuItem>
              <DropdownMenuItem>Deadlines</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Create table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add or Import Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add or import
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Create blank table
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV/Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Copy from template
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Connect external data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center Section */}
        <div className="flex items-center gap-2">
          {/* View Type Switcher */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <TooltipProvider>
              {viewTypes.map((view) => (
                <Tooltip key={view.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentViewType.id === view.id ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-7 px-2",
                        currentViewType.id === view.id && "shadow-sm"
                      )}
                      onClick={() => router.push(view.path)}
                    >
                      {view.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{view.name}</p>
                    <p className="text-xs text-muted-foreground">{view.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* View Name & Settings */}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <span>{viewName}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  All Projects
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Lock className="h-4 w-4 mr-2" />
                  My Projects
                </DropdownMenuItem>
                <DropdownMenuItem>Active Studies</DropdownMenuItem>
                <DropdownMenuItem>In Review</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Plus className="h-4 w-4 mr-2" />
                  Create new view
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsStarred(!isStarred)}
            >
              <Star className={cn(
                "h-4 w-4",
                isStarred && "fill-yellow-400 text-yellow-400"
              )} />
            </Button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Action Buttons */}
          {currentViewType.id === 'kanban' && (
            <Button variant="ghost" size="sm">
              <Settings2 className="h-4 w-4 mr-1" />
              Customize cards
            </Button>
          )}
          
          <Button variant="ghost" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Filter
            {filterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1">
                {filterCount}
              </Badge>
            )}
          </Button>
          
          <Button variant="ghost" size="sm">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Sort
          </Button>
          
          <Button variant="ghost" size="sm">
            <Palette className="h-4 w-4 mr-1" />
            Color
          </Button>
          
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share view
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Collaborators */}
          <div className="flex items-center -space-x-2">
            {collaborators.slice(0, 3).map((collaborator) => (
              <TooltipProvider key={collaborator.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={collaborator.avatar} />
                        <AvatarFallback className="text-xs">
                          {collaborator.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {collaborator.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{collaborator.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {collaborator.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {collaborators.length > 3 && (
              <Button variant="secondary" size="sm" className="h-7 w-7 p-0 ml-1">
                <span className="text-xs">+{collaborators.length - 3}</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-2">
              <Users className="h-4 w-4" />
            </Button>
          </div>

          {/* Tools Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Tools & Extensions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Bell className="h-4 w-4 mr-2" />
                Automations
                <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>Apps</DropdownMenuItem>
              <DropdownMenuItem>Extensions</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View settings</DropdownMenuItem>
              <DropdownMenuItem>Table settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}