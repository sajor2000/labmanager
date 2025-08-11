'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AccessibilityAnnouncerProps {
  message?: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
  className?: string;
}

// Main announcer component for screen readers
export function AccessibilityAnnouncer({
  message,
  priority = 'polite',
  clearAfter = 5000,
  className,
}: AccessibilityAnnouncerProps) {
  const [announcement, setAnnouncement] = useState(message);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (message) {
      setAnnouncement(message);

      if (clearAfter > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setAnnouncement('');
        }, clearAfter);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {announcement}
    </div>
  );
}

// Context for managing announcements across the app
interface AnnouncementContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceAction: (action: string, target?: string, result?: string) => void;
  announceNavigation: (from: string, to: string) => void;
  announceSelection: (count: number, total: number) => void;
  announceError: (error: string) => void;
  announceSuccess: (message: string) => void;
}

const AnnouncementContext = React.createContext<AnnouncementContextValue | null>(null);

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
  }>>([]);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = `announcement-${Date.now()}`;
    setAnnouncements(prev => [...prev, { id, message, priority }]);

    // Clear after delay
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const announceAction = (action: string, target?: string, result?: string) => {
    let message = action;
    if (target) message += ` ${target}`;
    if (result) message += `. ${result}`;
    announce(message);
  };

  const announceNavigation = (from: string, to: string) => {
    announce(`Navigated from ${from} to ${to}`);
  };

  const announceSelection = (count: number, total: number) => {
    if (count === 0) {
      announce('No items selected');
    } else if (count === total) {
      announce(`All ${total} items selected`);
    } else {
      announce(`${count} of ${total} items selected`);
    }
  };

  const announceError = (error: string) => {
    announce(`Error: ${error}`, 'assertive');
  };

  const announceSuccess = (message: string) => {
    announce(`Success: ${message}`);
  };

  return (
    <AnnouncementContext.Provider
      value={{
        announce,
        announceAction,
        announceNavigation,
        announceSelection,
        announceError,
        announceSuccess,
      }}
    >
      {children}
      {/* Render announcements */}
      <div className="sr-only">
        {announcements.map(({ id, message, priority }) => (
          <div
            key={id}
            role="status"
            aria-live={priority}
            aria-atomic="true"
          >
            {message}
          </div>
        ))}
      </div>
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements() {
  const context = React.useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within AnnouncementProvider');
  }
  return context;
}

// Skip links for keyboard navigation
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50">
      <a
        href="#main-content"
        className="block bg-primary text-primary-foreground px-4 py-2 focus:outline-none"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="block bg-primary text-primary-foreground px-4 py-2 focus:outline-none"
      >
        Skip to navigation
      </a>
      <a
        href="#search"
        className="block bg-primary text-primary-foreground px-4 py-2 focus:outline-none"
      >
        Skip to search
      </a>
    </div>
  );
}

// Focus trap for modals and dialogs
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function FocusTrap({ children, active = true, className }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Accessible loading states
interface AccessibleLoadingProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleLoading({
  isLoading,
  loadingText = 'Loading...',
  children,
  className,
}: AccessibleLoadingProps) {
  return (
    <div className={className} aria-busy={isLoading}>
      {isLoading && (
        <div role="status" aria-live="polite" className="sr-only">
          {loadingText}
        </div>
      )}
      {children}
    </div>
  );
}

// Form field announcements
interface FormFieldAnnouncerProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormFieldAnnouncer({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldAnnouncerProps) {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="block text-sm font-medium mb-1">
        {label}
        {required && <span aria-label="required"> *</span>}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground mb-1">
          {hint}
        </p>
      )}
      
      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-required': required,
        'aria-invalid': !!error,
        'aria-describedby': [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined,
      })}
      
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// Table accessibility helpers
export function AccessibleTable({
  caption,
  summary,
  children,
  className,
}: {
  caption: string;
  summary?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <table
      className={className}
      role="table"
      aria-label={caption}
      aria-describedby={summary ? `${caption}-summary` : undefined}
    >
      <caption className="sr-only">{caption}</caption>
      {summary && (
        <span id={`${caption}-summary`} className="sr-only">
          {summary}
        </span>
      )}
      {children}
    </table>
  );
}

// Progress indicator
export function AccessibleProgress({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
}) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="relative h-2 bg-gray-200 rounded-full overflow-hidden"
      >
        <div
          className="absolute left-0 top-0 h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="sr-only">
        {label}: {percentage}% complete
      </span>
    </div>
  );
}