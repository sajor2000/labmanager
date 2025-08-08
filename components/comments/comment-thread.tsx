'use client';

import { useState, useCallback, useMemo } from 'react';
import { CommentableType } from '@prisma/client';
import { useComments, useCreateComment, useUpdateComment, useDeleteComment, formatCommentContent } from '@/hooks/use-comments';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommentThreadProps {
  entityType: CommentableType;
  entityId: string;
  className?: string;
  maxHeight?: string;
  showTitle?: boolean;
}

export function CommentThread({
  entityType,
  entityId,
  className = '',
  maxHeight = '600px',
  showTitle = true,
}: CommentThreadProps) {
  const [page, setPage] = useState(1);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  // Fetch comments
  const { data, isLoading, error, refetch } = useComments(
    entityType,
    entityId,
    null, // Only root comments
    page,
    20
  );

  // Mutations
  const createComment = useCreateComment();
  const updateComment = useUpdateComment(editingCommentId || '');
  const deleteComment = useDeleteComment(editingCommentId || '');

  // Handle comment submission
  const handleSubmitComment = useCallback(
    async (content: string, parentId?: string | null) => {
      try {
        await createComment.mutateAsync({
          content,
          entityType,
          entityId,
          parentId,
        });
        setReplyingToId(null);
      } catch (error) {
        console.error('Failed to create comment:', error);
      }
    },
    [createComment, entityType, entityId]
  );

  // Handle comment edit
  const handleEditComment = useCallback(
    async (commentId: string, content: string) => {
      try {
        await updateComment.mutateAsync({ content });
        setEditingCommentId(null);
      } catch (error) {
        console.error('Failed to update comment:', error);
      }
    },
    [updateComment]
  );

  // Handle comment delete
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        await deleteComment.mutateAsync();
        setEditingCommentId(null);
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    },
    [deleteComment]
  );

  // Handle pagination
  const handleLoadMore = useCallback(() => {
    if (data && page < data.pagination.totalPages) {
      setPage((prev) => prev + 1);
    }
  }, [data, page]);

  // Memoize comments count
  const totalComments = useMemo(() => data?.pagination.total || 0, [data]);

  if (isLoading && page === 1) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Comments</h3>
          </div>
        )}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load comments. Please try again.
          <Button
            variant="link"
            size="sm"
            onClick={() => refetch()}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              Comments {totalComments > 0 && `(${totalComments})`}
            </h3>
          </div>
        </div>
      )}

      {/* Comment form for new root comments */}
      <CommentForm
        onSubmit={(content) => handleSubmitComment(content, null)}
        placeholder="Write a comment..."
        isSubmitting={createComment.isPending}
      />

      {/* Comments list */}
      {data?.comments && data.comments.length > 0 ? (
        <ScrollArea style={{ maxHeight }} className="pr-4">
          <div className="space-y-4">
            {data.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={(content) => handleSubmitComment(content, comment.id)}
                onEdit={(content) => handleEditComment(comment.id, content)}
                onDelete={() => handleDeleteComment(comment.id)}
                isEditing={editingCommentId === comment.id}
                isReplying={replyingToId === comment.id}
                onStartEdit={() => setEditingCommentId(comment.id)}
                onCancelEdit={() => setEditingCommentId(null)}
                onStartReply={() => setReplyingToId(comment.id)}
                onCancelReply={() => setReplyingToId(null)}
                entityType={entityType}
                entityId={entityId}
              />
            ))}

            {/* Load more button */}
            {data.pagination.page < data.pagination.totalPages && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More Comments'}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No comments yet</p>
          <p className="text-sm mt-1">Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}