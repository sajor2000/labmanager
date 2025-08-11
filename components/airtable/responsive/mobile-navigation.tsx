'use client';

import React, { useState } from 'react';
import { 
  Menu, X, Home, Grid3x3, Kanban, Calendar,
  List, Users, Settings, Search, Plus, Filter,
  ChevronLeft, ChevronRight, MoreVertical, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import type { ViewType } from '@/types';

interface MobileNavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  views: Array<{
    id: string;
    name: string;
    type: ViewType;
    icon?: React.ReactNode;
    count?: number;
  }>;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  workspaceName: string;
  onSearch?: (query: string) => void;
  onAddRecord?: () => void;
  className?: string;
}

const VIEW_ICONS: Record<ViewType, React.ReactNode> = {
  TABLE: <Grid3x3 className="h-4 w-4" />,
  KANBAN: <Kanban className="h-4 w-4" />,
  CALENDAR: <Calendar className="h-4 w-4" />,
  GALLERY: <Layers className="h-4 w-4" />,
  TIMELINE: <List className="h-4 w-4" />,
  GANTT: <List className="h-4 w-4" />,
  FORM: <List className="h-4 w-4" />,
};

export function MobileNavigation({
  currentView,
  onViewChange,
  views,
  user,
  workspaceName,
  onSearch,
  onAddRecord,
  className,
}: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const currentViewIndex = views.findIndex(v => v.type === currentView);

  const handleSwipe = (event: any, info: PanInfo) => {
    const threshold = 50;
    
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0 && currentViewIndex > 0) {
        // Swipe right - previous view
        onViewChange(views[currentViewIndex - 1].type);
        setSwipeDirection('right');
      } else if (info.offset.x < 0 && currentViewIndex < views.length - 1) {
        // Swipe left - next view
        onViewChange(views[currentViewIndex + 1].type);
        setSwipeDirection('left');
      }
      
      setTimeout(() => setSwipeDirection(null), 300);
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    }
    setIsSearchOpen(false);
  };

  const NavigationTabs = () => (
    <div className="flex items-center gap-1 px-2 overflow-x-auto scrollbar-hide">
      {views.map((view, index) => (
        <Button
          key={view.id}
          variant={view.type === currentView ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(view.type)}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap",
            view.type === currentView && "shadow-sm"
          )}
        >
          {view.icon || VIEW_ICONS[view.type]}
          <span className="text-xs">{view.name}</span>
          {view.count !== undefined && (
            <Badge variant="secondary" className="h-5 px-1 text-xs">
              {view.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className={cn(
        "lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b",
        className
      )}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Menu & Workspace */}
          <div className="flex items-center gap-3">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>{workspaceName}</SheetTitle>
                  <SheetDescription>
                    Navigate your workspace
                  </SheetDescription>
                </SheetHeader>
                
                <ScrollArea className="h-[calc(100vh-140px)]">
                  <div className="p-4 space-y-4">
                    {/* User Profile */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Views */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Views
                      </p>
                      {views.map((view) => (
                        <Button
                          key={view.id}
                          variant={view.type === currentView ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            onViewChange(view.type);
                            setIsMenuOpen(false);
                          }}
                        >
                          {view.icon || VIEW_ICONS[view.type]}
                          <span className="ml-2">{view.name}</span>
                          {view.count !== undefined && (
                            <Badge variant="outline" className="ml-auto">
                              {view.count}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    {/* Actions */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Actions
                      </p>
                      <Button variant="ghost" className="w-full justify-start">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            <h1 className="text-lg font-semibold truncate">
              {views.find(v => v.type === currentView)?.name || 'View'}
            </h1>
          </div>
          
          {/* Right: Search & Add */}
          <div className="flex items-center gap-2">
            <Drawer open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Search className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Search</DrawerTitle>
                  <DrawerDescription>
                    Search across all records and fields
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      autoFocus
                    />
                    <Button onClick={handleSearch}>
                      Search
                    </Button>
                  </div>
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
            
            {onAddRecord && (
              <Button
                size="sm"
                onClick={onAddRecord}
                className="h-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Layers className="h-4 w-4 mr-2" />
                  Group
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  View settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* View Tabs */}
        <div className="border-t">
          <NavigationTabs />
        </div>
      </div>
      
      {/* Swipe Gesture Area */}
      <motion.div
        className="lg:hidden fixed inset-x-0 top-[104px] bottom-0 pointer-events-none"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleSwipe}
      />
      
      {/* Swipe Indicator */}
      <AnimatePresence>
        {swipeDirection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-black/80 text-white rounded-full p-4">
              {swipeDirection === 'left' ? (
                <ChevronLeft className="h-8 w-8" />
              ) : (
                <ChevronRight className="h-8 w-8" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bottom Navigation (Alternative) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40">
        <div className="flex items-center justify-around py-2">
          {views.slice(0, 4).map((view) => (
            <Button
              key={view.id}
              variant="ghost"
              size="sm"
              onClick={() => onViewChange(view.type)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3",
                view.type === currentView && "text-primary"
              )}
            >
              {view.icon || VIEW_ICONS[view.type]}
              <span className="text-[10px]">{view.name}</span>
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-3"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="text-[10px]">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              {views.slice(4).map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => onViewChange(view.type)}
                >
                  {view.icon || VIEW_ICONS[view.type]}
                  <span className="ml-2">{view.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}