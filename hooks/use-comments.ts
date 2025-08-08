import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommentableType } from '@prisma/client';
import { useCurrentUser } from './use-current-user';

interface Comment {
  id: string;
  content: string;
  entityType: CommentableType;
  entityId: string;
  parentId: string | null;
  authorId: string;
  editedAt: Date | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    avatarUrl: string | null;
    initials: string;
  };
  mentions?: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      firstName: string;
      lastName: string;
    };
  }[];
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateCommentData {
  content: string;
  entityType: CommentableType;
  entityId: string;
  parentId?: string | null;
}

interface UpdateCommentData {
  content: string;
}

// Fetch comments for an entity
export function useComments(
  entityType: CommentableType | null,
  entityId: string | null,
  parentId?: string | null,
  page: number = 1,
  limit: number = 20
) {
  return useQuery<CommentsResponse>({
    queryKey: ['comments', entityType, entityId, parentId, page, limit],
    queryFn: async () => {
      if (!entityType || !entityId) {
        throw new Error('entityType and entityId are required');
      }

      const params = new URLSearchParams({
        entityType,
        entityId,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (parentId !== undefined) {
        params.append('parentId', parentId || 'null');
      }

      const response = await fetch(`/api/comments?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json();
    },
    enabled: !!entityType && !!entityId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch a single comment with replies
export function useComment(commentId: string | null) {
  return useQuery<Comment>({
    queryKey: ['comment', commentId],
    queryFn: async () => {
      if (!commentId) {
        throw new Error('commentId is required');
      }

      const response = await fetch(`/api/comments/${commentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comment');
      }
      return response.json();
    },
    enabled: !!commentId,
  });
}

// Fetch replies for a comment
export function useCommentReplies(
  commentId: string | null,
  page: number = 1,
  limit: number = 10,
  includeNested: boolean = false
) {
  return useQuery<{ replies: Comment[]; pagination: any }>({
    queryKey: ['comment-replies', commentId, page, limit, includeNested],
    queryFn: async () => {
      if (!commentId) {
        throw new Error('commentId is required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeNested: includeNested.toString(),
      });

      const response = await fetch(`/api/comments/${commentId}/replies?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch replies');
      }
      return response.json();
    },
    enabled: !!commentId,
  });
}

// Create a new comment
export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation<Comment, Error, CreateCommentData>({
    mutationFn: async (data) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          authorId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create comment');
      }

      return response.json();
    },
    onSuccess: (newComment) => {
      // Invalidate comments list for the entity
      queryClient.invalidateQueries({
        queryKey: ['comments', newComment.entityType, newComment.entityId],
      });

      // If it's a reply, also invalidate the parent comment and its replies
      if (newComment.parentId) {
        queryClient.invalidateQueries({
          queryKey: ['comment', newComment.parentId],
        });
        queryClient.invalidateQueries({
          queryKey: ['comment-replies', newComment.parentId],
        });
      }

      // Invalidate notifications for the current user (they might have new mentions)
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
      });
    },
  });
}

// Update a comment
export function useUpdateComment(commentId: string) {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation<Comment, Error, UpdateCommentData>({
    mutationFn: async (data) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update comment');
      }

      return response.json();
    },
    onSuccess: (updatedComment) => {
      // Invalidate the specific comment
      queryClient.invalidateQueries({
        queryKey: ['comment', commentId],
      });

      // Invalidate comments list for the entity
      queryClient.invalidateQueries({
        queryKey: ['comments', updatedComment.entityType, updatedComment.entityId],
      });

      // If it's a reply, also invalidate parent's replies
      if (updatedComment.parentId) {
        queryClient.invalidateQueries({
          queryKey: ['comment-replies', updatedComment.parentId],
        });
      }
    },
  });
}

// Delete a comment
export function useDeleteComment(commentId: string) {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation<void, Error>({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/comments/${commentId}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete comment');
      }
    },
    onSuccess: () => {
      // Invalidate all comment-related queries
      queryClient.invalidateQueries({
        queryKey: ['comments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['comment'],
      });
      queryClient.invalidateQueries({
        queryKey: ['comment-replies'],
      });
    },
  });
}

// Helper function to extract mentions from comment content
export function extractMentions(content: string): string[] {
  const mentionMatches = content.match(/@(\w+)/g) || [];
  return mentionMatches.map((m) => m.substring(1));
}

// Helper function to format comment content with mention highlighting
export function formatCommentContent(content: string): string {
  // Replace @mentions with styled spans
  return content.replace(
    /@(\w+)/g,
    '<span class="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">@$1</span>'
  );
}