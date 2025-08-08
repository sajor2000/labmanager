'use client';

import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CommentableType } from '@prisma/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCommentReplies } from '@/hooks/use-comments';
import { CommentForm } from './comment-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Reply,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: any;
  onReply: (content: string) => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  isEditing: boolean;
  isReplying: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onStartReply: () => void;
  onCancelReply: () => void;
  entityType: CommentableType;
  entityId: string;
  depth?: number;
}

export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  isEditing,
  isReplying,
  onStartEdit,
  onCancelEdit,
  onStartReply,
  onCancelReply,
  entityType,
  entityId,
  depth = 0,
}: CommentItemProps) {
  const { user } = useCurrentUser();
  const [showReplies, setShowReplies] = useState(false);
  const [repliesPage, setRepliesPage] = useState(1);

  // Fetch replies if expanded
  const { data: repliesData, isLoading: loadingReplies } = useCommentReplies(
    showReplies ? comment.id : null,
    repliesPage,
    10,
    false
  );

  const isAuthor = user?.id === comment.authorId;
  const hasReplies = comment._count?.replies > 0;
  const replyCount = comment._count?.replies || 0;

  // Toggle replies visibility
  const toggleReplies = useCallback(() => {
    setShowReplies((prev) => !prev);
  }, []);

  // Format comment content with mentions
  const formattedContent = useCallback((content: string) => {
    return content.replace(
      /@(\w+)/g,
      '<span class="text-blue-600 dark:text-blue-400 font-medium">@$1</span>'
    );
  }, []);

  // Render avatar
  const renderAvatar = () => (
    <Avatar className="h-8 w-8">
      {comment.author.avatarUrl ? (
        <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
      ) : (
        <AvatarFallback className={cn('text-xs', comment.author.avatar)}>
          {comment.author.initials}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <div className={cn('group', depth > 0 && 'ml-8')}>
      <div className="flex gap-3">
        {renderAvatar()}
        
        <div className="flex-1 space-y-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {comment.author.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.editedAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  edited
                </span>
              )}
            </div>

            {/* Actions menu */}
            {isAuthor && !comment.isDeleted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onStartEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content or edit form */}
          {isEditing ? (
            <CommentForm
              initialValue={comment.content}
              onSubmit={onEdit}
              onCancel={onCancelEdit}
              placeholder="Edit your comment..."
              isSubmitting={false}
              autoFocus
            />
          ) : (
            <>
              {comment.isDeleted ? (
                <p className="text-sm text-muted-foreground italic">
                  [This comment has been deleted]
                </p>
              ) : (
                <div
                  className="text-sm prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: formattedContent(comment.content) }}
                />
              )}

              {/* Action buttons */}
              {!comment.isDeleted && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={onStartReply}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>

                  {hasReplies && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={toggleReplies}
                    >
                      {showReplies ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Hide {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Show {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Reply form */}
              {isReplying && (
                <div className="mt-3">
                  <CommentForm
                    onSubmit={onReply}
                    onCancel={onCancelReply}
                    placeholder={`Reply to ${comment.author.firstName || comment.author.name}...`}
                    isSubmitting={false}
                    autoFocus
                  />
                </div>
              )}

              {/* Nested replies */}
              {showReplies && repliesData?.replies && (
                <div className="mt-3 space-y-3">
                  {repliesData.replies.map((reply: any) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isEditing={false}
                      isReplying={false}
                      onStartEdit={() => {}}
                      onCancelEdit={() => {}}
                      onStartReply={() => {}}
                      onCancelReply={() => {}}
                      entityType={entityType}
                      entityId={entityId}
                      depth={depth + 1}
                    />
                  ))}

                  {/* Load more replies */}
                  {repliesData.pagination.page < repliesData.pagination.totalPages && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setRepliesPage((prev) => prev + 1)}
                      disabled={loadingReplies}
                    >
                      {loadingReplies ? 'Loading...' : 'Load more replies'}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}