'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, MoreHorizontal, 
  Edit2, Trash2, Copy, Archive, Share2, Star,
  MessageSquare, Paperclip, Clock, User, Link2,
  Activity, History, Settings, Maximize2, Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FieldRenderer } from '../fields/field-renderer';
import { FieldEditor } from '../fields/field-editor';
import type { Project } from '@/types';
import type { FieldType } from '../fields/field-types';
import { format } from 'date-fns';

interface RecordDetailPanelProps {
  record: any;
  fields: Array<{
    id: string;
    name: string;
    type: FieldType;
    options?: any;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updates: any) => void;
  onDelete?: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasNavigation?: boolean;
  className?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  mentions?: string[];
  attachments?: string[];
}

interface Activity {
  id: string;
  type: 'created' | 'updated' | 'commented' | 'status_changed' | 'assigned';
  userId: string;
  userName: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

export function RecordDetailPanel({
  record,
  fields,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onNavigate,
  hasNavigation = false,
  className,
  width = 'lg',
}: RecordDetailPanelProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [comment, setComment] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  
  // Mock data for demonstration
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      userAvatar: '/avatar1.jpg',
      content: 'Initial project setup completed. Ready for review.',
      createdAt: new Date('2024-01-10T10:00:00'),
      mentions: ['@jane'],
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Jane Smith',
      userAvatar: '/avatar2.jpg',
      content: 'Looks good! I\'ve added some additional requirements to the scope.',
      createdAt: new Date('2024-01-10T14:30:00'),
      attachments: ['requirements.pdf'],
    },
  ]);
  
  const activities: Activity[] = [
    {
      id: '1',
      type: 'created',
      userId: 'user1',
      userName: 'John Doe',
      description: 'created this record',
      timestamp: new Date('2024-01-09T09:00:00'),
    },
    {
      id: '2',
      type: 'status_changed',
      userId: 'user1',
      userName: 'John Doe',
      description: 'changed status from Planning to In Progress',
      timestamp: new Date('2024-01-10T10:00:00'),
    },
    {
      id: '3',
      type: 'assigned',
      userId: 'user2',
      userName: 'Jane Smith',
      description: 'assigned this to Mike Johnson',
      timestamp: new Date('2024-01-10T14:30:00'),
    },
  ];
  
  const widthClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-4xl',
    xl: 'sm:max-w-6xl',
    full: 'sm:max-w-full',
  };
  
  const handleFieldSave = (fieldId: string, value: any) => {
    onUpdate?.({ [fieldId]: value });
    setEditingField(null);
  };
  
  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'Current User',
      content: comment,
      createdAt: new Date(),
    };
    
    setComments([...comments, newComment]);
    setComment('');
  };
  
  const getFieldValue = (fieldId: string) => {
    return record[fieldId];
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        className={cn(
          "w-full p-0 gap-0",
          widthClasses[width],
          isExpanded && "sm:max-w-full",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {hasNavigation && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsStarred(!isStarred)}
            >
              <Star className={cn(
                "h-4 w-4",
                isStarred && "fill-yellow-400 text-yellow-400"
              )} />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Title */}
        <div className="p-4 border-b">
          <Input
            value={record.name || record.title || 'Untitled'}
            onChange={(e) => onUpdate?.({ name: e.target.value })}
            className="text-xl font-semibold border-0 p-0 h-auto focus-visible:ring-0"
            placeholder="Untitled"
          />
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
            <TabsTrigger 
              value="details" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger 
              value="comments" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
              {comments.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1">
                  {comments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
            >
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="attachments" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attachments
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1">
            <TabsContent value="details" className="p-4 space-y-4 m-0">
              {/* Fields */}
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.name}
                  </label>
                  {editingField === field.id ? (
                    <FieldEditor
                      type={field.type}
                      value={getFieldValue(field.id)}
                      options={field.options}
                      onSave={(value) => handleFieldSave(field.id, value)}
                      onCancel={() => setEditingField(null)}
                    />
                  ) : (
                    <div
                      className="p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => setEditingField(field.id)}
                    >
                      <FieldRenderer
                        type={field.type}
                        value={getFieldValue(field.id)}
                        options={field.options}
                      />
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="comments" className="p-4 space-y-4 m-0">
              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.userAvatar} />
                      <AvatarFallback>
                        {comment.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(comment.createdAt, 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Paperclip className="h-3 w-3" />
                          <span className="text-xs text-blue-600">
                            {comment.attachments.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Comment */}
              <div className="space-y-2 pt-4 border-t">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComment('')}
                    disabled={!comment.trim()}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!comment.trim()}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="p-4 m-0">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>
                        {' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          {activity.description}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(activity.timestamp, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="attachments" className="p-4 m-0">
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Paperclip className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drop files here or click to upload
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose Files
                </Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}