'use client';

import { useState } from 'react';
import { X, Plus, Mail, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailRecipientSelectorProps {
  recipients: EmailRecipient[];
  suggestedRecipients?: EmailRecipient[];
  onChange: (recipients: EmailRecipient[]) => void;
  className?: string;
}

export function EmailRecipientSelector({
  recipients,
  suggestedRecipients = [],
  onChange,
  className,
}: EmailRecipientSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Filter suggestions that aren't already added
  const availableSuggestions = suggestedRecipients.filter(
    suggestion => !recipients.some(r => r.email === suggestion.email)
  );

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddRecipient = () => {
    const email = inputValue.trim();
    
    if (!email) {
      setInputError('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      setInputError('Please enter a valid email address');
      return;
    }

    if (recipients.some(r => r.email === email)) {
      setInputError('This email is already added');
      return;
    }

    onChange([...recipients, { email }]);
    setInputValue('');
    setInputError('');
  };

  const handleRemoveRecipient = (email: string) => {
    onChange(recipients.filter(r => r.email !== email));
  };

  const handleAddSuggestion = (suggestion: EmailRecipient) => {
    onChange([...recipients, suggestion]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRecipient();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Recipients */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Recipients ({recipients.length})
        </label>
        <div className="min-h-[60px] rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
          {recipients.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recipients added yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recipients.map((recipient) => (
                <Badge
                  key={recipient.email}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  <Mail className="h-3 w-3" />
                  <span className="max-w-[200px] truncate">
                    {recipient.name || recipient.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1 h-4 w-4 rounded-full p-0 hover:bg-gray-600"
                    onClick={() => handleRemoveRecipient(recipient.email)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Email */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Add Email Address
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="email"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter email address"
              className={cn(inputError && 'border-red-500')}
            />
            {inputError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {inputError}
              </p>
            )}
          </div>
          <Button
            onClick={handleAddRecipient}
            disabled={!inputValue.trim()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Suggested Recipients */}
      {availableSuggestions.length > 0 && showSuggestions && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Suggested Recipients
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(false)}
              className="h-6 text-xs"
            >
              Hide
            </Button>
          </div>
          <div className="space-y-2">
            {availableSuggestions.map((suggestion) => (
              <div
                key={suggestion.email}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSuggestion(suggestion)}
                  className="h-7 text-xs"
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add All Suggestions */}
      {availableSuggestions.length > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onChange([...recipients, ...availableSuggestions]);
            setShowSuggestions(false);
          }}
          className="w-full"
        >
          Add All Suggested Recipients ({availableSuggestions.length})
        </Button>
      )}
    </div>
  );
}