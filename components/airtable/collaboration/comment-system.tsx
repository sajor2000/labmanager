'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Reply, MoreHorizontal, 
  Heart, Bookmark, Edit3, Trash2, Pin,
  AtSign, Hash, Paperclip, Smile, ChevronDown,
  Check, X, AlertCircle, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from './presence-system';

export interface Comment {
  id: string;
  user: User;
  content: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  resolved?: boolean;
  resolvedBy?: User;
  resolvedAt?: Date;
  pinned?: boolean;
  reactions?: {
    emoji: string;
    users: User[];
  }[];
  mentions?: User[];
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
  replyTo?: string;
  replies?: Comment[];
}

interface CommentSystemProps {
  comments: Comment[];
  currentUser: User;
  onAddComment: (content: string, mentions?: User[], attachments?: any[], replyTo?: string) => Promise<void>;
  onEditComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onResolveComment?: (commentId: string, resolved: boolean) => Promise<void>;
  onPinComment?: (commentId: string, pinned: boolean) => Promise<void>;
  onReaction?: (commentId: string, emoji: string) => Promise<void>;
  users?: User[];
  placeholder?: string;
  showResolveButton?: boolean;
  showThreading?: boolean;
  maxDepth?: number;
  className?: string;
}

const REACTION_EMOJIS = ['👍', '❤️', '🎉', '😄', '🤔', '👀'];

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

function parseContent(content: string, mentions?: User[]): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const mentionRegex = /@(\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    // Add mention
    const username = match[1];
    const user = mentions?.find(u => u.name.toLowerCase().includes(username.toLowerCase()));
    
    parts.push(
      <span
        key={match.index}
        className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
      >
        @{username}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

export function CommentSystem({
  comments,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onResolveComment,
  onPinComment,
  onReaction,
  users = [],
  placeholder = 'Add a comment...',
  showResolveButton = true,
  showThreading = true,
  maxDepth = 3,
  className,
}: CommentSystemProps) {
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedMentions, setSelectedMentions] = useState<User[]>([]);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pinnedComments = comments.filter(c => c.pinned);
  const regularComments = comments.filter(c => !c.pinned && !c.replyTo);
  const resolvedComments = comments.filter(c => c.resolved);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment, selectedMentions, [], replyingTo || undefined);
      setNewComment('');
      setSelectedMentions([]);
      setReplyingTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim() || !onEditComment) return;

    await onEditComment(commentId, editContent);
    setEditingComment(null);
    setEditContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === '@') {
      setShowMentions(true);
    }
  };

  const insertMention = (user: User) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    // Find the @ symbol
    const lastAt = before.lastIndexOf('@');
    if (lastAt !== -1) {
      const newText = before.substring(0, lastAt) + `@${user.name} ` + after;
      setNewComment(newText);
      setSelectedMentions([...selectedMentions, user]);
    }
    
    setShowMentions(false);
    setMentionSearch('');
  };

  const toggleThread = (commentId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const isEditing = editingComment === comment.id;
    const replies = comments.filter(c => c.replyTo === comment.id);
    const hasReplies = replies.length > 0;
    const isExpanded = expandedThreads.has(comment.id);
    const canReply = showThreading && depth < maxDepth;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "group",
          depth > 0 && "ml-12 mt-2"
        )}
      >
        <div className={cn(
          "flex gap-3 p-3 rounded-lg transition-colors",
          comment.resolved && "opacity-60",
          comment.pinned && "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
        )}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.user.avatar} />
            <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{comment.user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(comment.timestamp)}
                  </span>
                  {comment.edited && (
                    <span className="text-xs text-muted-foreground">(edited)</span>
                  )}
                  {comment.pinned && (
                    <Badge variant="secondary" className="text-xs">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  {comment.resolved && (
                    <Badge variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Resolved
                    </Badge>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="mt-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px]"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(comment.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-sm">
                    {parseContent(comment.content, comment.mentions)}
                  </div>
                )}
                
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {comment.attachments.map((attachment) => (
                      <Badge
                        key={attachment.id}
                        variant="outline"
                        className="cursor-pointer"
                      >
                        <Paperclip className="h-3 w-3 mr-1" />
                        {attachment.name}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {comment.reactions && comment.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {comment.reactions.map((reaction) => (
                      <TooltipProvider key={reaction.emoji}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 gap-1"
                              onClick={() => onReaction?.(comment.id, reaction.emoji)}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-xs">{reaction.users.length}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              {reaction.users.map(u => u.name).join(', ')}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onReaction && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Smile className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="flex gap-1">
                          {REACTION_EMOJIS.map((emoji) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onReaction(comment.id, emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  
                  {canReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                  
                  {hasReplies && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => toggleThread(comment.id)}
                    >
                      <ChevronDown className={cn(
                        "h-3 w-3 mr-1 transition-transform",
                        !isExpanded && "-rotate-90"
                      )} />
                      {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </Button>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {comment.user.id === currentUser.id && onEditComment && (
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditContent(comment.content);
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onPinComment && (
                    <DropdownMenuItem
                      onClick={() => onPinComment(comment.id, !comment.pinned)}
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      {comment.pinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                  )}
                  {showResolveButton && onResolveComment && (
                    <DropdownMenuItem
                      onClick={() => onResolveComment(comment.id, !comment.resolved)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {comment.resolved ? 'Unresolve' : 'Resolve'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {comment.user.id === currentUser.id && onDeleteComment && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {isExpanded && hasReplies && (
          <div className="mt-2">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
        
        {replyingTo === comment.id && (
          <div className="ml-11 mt-2">
            <div className="flex gap-2">
              <Textarea
                placeholder={`Reply to ${comment.user.name}...`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px]"
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setNewComment('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Comment Input */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentUser.avatar} />
          <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px]"
          />
          
          {showMentions && users.length > 0 && (
            <div className="absolute z-10 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg border shadow-lg">
              <ScrollArea className="max-h-[200px]">
                <div className="p-2">
                  {users
                    .filter(u => u.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                    .map((user) => (
                      <button
                        key={user.id}
                        onClick={() => insertMention(user)}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs">
                            {user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                      </button>
                    ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMentions(!showMentions)}
              >
                <AtSign className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              Comment
            </Button>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Comments List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {/* Pinned Comments */}
          {pinnedComments.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-3 py-1">
                <Pin className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Pinned</span>
              </div>
              {pinnedComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
              <Separator className="my-2" />
            </>
          )}
          
          {/* Regular Comments */}
          {regularComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
          
          {/* Resolved Comments */}
          {resolvedComments.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="flex items-center gap-2 px-3 py-1">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Resolved</span>
              </div>
              {resolvedComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </>
          )}
          
          {comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Be the first to comment</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}