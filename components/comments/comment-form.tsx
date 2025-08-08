'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, AtSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  initialValue?: string;
  placeholder?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function CommentForm({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder = 'Write a comment...',
  isSubmitting = false,
  autoFocus = false,
  className = '',
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debouncedMentionSearch = useDebounce(mentionSearch, 300);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Search for users when @ is typed
  useEffect(() => {
    if (debouncedMentionSearch && showMentions) {
      searchUsers(debouncedMentionSearch);
    }
  }, [debouncedMentionSearch]);

  // Search users for mentions
  const searchUsers = async (query: string) => {
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const users = await response.json();
        setMentionUsers(users);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  // Handle text input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setContent(value);

    // Check for @ mention trigger
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if we're still in a mention context (no space after @)
      if (!textAfterAt.includes(' ')) {
        setShowMentions(true);
        setMentionSearch(textAfterAt);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Handle keyboard navigation for mentions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && mentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev < mentionUsers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev > 0 ? prev - 1 : mentionUsers.length - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionUsers[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  // Insert selected mention
  const insertMention = (user: any) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeMention = content.substring(0, lastAtIndex);
      const afterMention = content.substring(cursorPosition);
      const username = user.firstName || user.email.split('@')[0];
      const newContent = `${beforeMention}@${username} ${afterMention}`;
      
      setContent(newContent);
      setShowMentions(false);
      
      // Set cursor position after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = lastAtIndex + username.length + 2;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    const trimmedContent = content.trim();
    if (trimmedContent && !isSubmitting) {
      onSubmit(trimmedContent);
      setContent('');
      setShowMentions(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[80px] pr-20 resize-none"
          disabled={isSubmitting}
        />
        
        {/* Character count */}
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
          {content.length > 0 && `${content.length} characters`}
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="h-8 w-8 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mention suggestions dropdown */}
      {showMentions && mentionUsers.length > 0 && (
        <div className="absolute z-50 mt-1 w-64 bg-popover border rounded-md shadow-lg">
          <div className="py-1">
            {mentionUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={cn(
                  'w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-accent',
                  index === selectedMentionIndex && 'bg-accent'
                )}
                onClick={() => insertMention(user)}
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {user.initials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.firstName || user.email.split('@')[0]}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="mt-1 text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to submit, 
        <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Shift+Enter</kbd> for new line,
        <AtSign className="inline h-3 w-3 ml-1" /> to mention someone
      </div>
    </div>
  );
}