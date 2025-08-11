'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface KeyboardNavigationProps {
  items: Array<{
    id: string;
    [key: string]: any;
  }>;
  onSelect?: (item: any) => void;
  onActivate?: (item: any) => void;
  onDelete?: (item: any) => void;
  onCopy?: (item: any) => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  children: (props: {
    focusedIndex: number;
    selectedItems: Set<string>;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    setFocusedIndex: (index: number) => void;
  }) => React.ReactNode;
  className?: string;
}

// Keyboard shortcuts map
const SHORTCUTS = {
  selectAll: { key: 'a', ctrl: true, meta: true },
  copy: { key: 'c', ctrl: true, meta: true },
  paste: { key: 'v', ctrl: true, meta: true },
  cut: { key: 'x', ctrl: true, meta: true },
  undo: { key: 'z', ctrl: true, meta: true },
  redo: { key: 'z', ctrl: true, meta: true, shift: true },
  delete: { key: 'Delete' },
  search: { key: '/', ctrl: false },
  searchAlt: { key: 'k', ctrl: true, meta: true },
  escape: { key: 'Escape' },
  moveUp: { key: 'ArrowUp' },
  moveDown: { key: 'ArrowDown' },
  moveLeft: { key: 'ArrowLeft' },
  moveRight: { key: 'ArrowRight' },
  select: { key: ' ' },
  activate: { key: 'Enter' },
  multiSelect: { key: 'Shift' },
  tab: { key: 'Tab' },
  home: { key: 'Home' },
  end: { key: 'End' },
  pageUp: { key: 'PageUp' },
  pageDown: { key: 'PageDown' },
};

export function KeyboardNavigation({
  items,
  onSelect,
  onActivate,
  onDelete,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onSearch,
  onEscape,
  children,
  className,
}: KeyboardNavigationProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

    // Navigation
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigateUp(e.shiftKey);
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateDown(e.shiftKey);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigateLeft(e.shiftKey);
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateRight(e.shiftKey);
        break;
      case 'Home':
        e.preventDefault();
        navigateToStart(e.shiftKey);
        break;
      case 'End':
        e.preventDefault();
        navigateToEnd(e.shiftKey);
        break;
      case 'PageUp':
        e.preventDefault();
        navigatePageUp(e.shiftKey);
        break;
      case 'PageDown':
        e.preventDefault();
        navigatePageDown(e.shiftKey);
        break;
    }

    // Selection
    if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      toggleSelection(focusedIndex);
    }

    // Activation
    if (e.key === 'Enter') {
      e.preventDefault();
      if (items[focusedIndex] && onActivate) {
        onActivate(items[focusedIndex]);
      }
    }

    // Select All
    if (ctrlKey && e.key === 'a') {
      e.preventDefault();
      selectAll();
    }

    // Copy
    if (ctrlKey && e.key === 'c' && onCopy) {
      e.preventDefault();
      const selected = items.filter(item => selectedItems.has(item.id));
      if (selected.length > 0) {
        onCopy(selected);
        showToast('Copied', `${selected.length} item(s) copied`);
      }
    }

    // Paste
    if (ctrlKey && e.key === 'v' && onPaste) {
      e.preventDefault();
      onPaste();
    }

    // Delete
    if (e.key === 'Delete' && onDelete) {
      e.preventDefault();
      const selected = items.filter(item => selectedItems.has(item.id));
      if (selected.length > 0) {
        onDelete(selected);
      }
    }

    // Undo/Redo
    if (ctrlKey && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey && onRedo) {
        onRedo();
      } else if (!e.shiftKey && onUndo) {
        onUndo();
      }
    }

    // Search
    if ((e.key === '/' || (ctrlKey && e.key === 'k')) && onSearch) {
      e.preventDefault();
      onSearch();
    }

    // Escape
    if (e.key === 'Escape') {
      if (selectedItems.size > 0) {
        setSelectedItems(new Set());
      } else if (onEscape) {
        onEscape();
      }
    }

    // Tab navigation
    if (e.key === 'Tab') {
      if (!e.shiftKey) {
        navigateDown(false);
      } else {
        navigateUp(false);
      }
    }
  };

  // Navigation helpers
  const navigateUp = (withSelection: boolean) => {
    const newIndex = Math.max(0, focusedIndex - 1);
    setFocusedIndex(newIndex);
    if (withSelection) {
      handleRangeSelection(newIndex);
    }
    scrollToItem(newIndex);
  };

  const navigateDown = (withSelection: boolean) => {
    const newIndex = Math.min(items.length - 1, focusedIndex + 1);
    setFocusedIndex(newIndex);
    if (withSelection) {
      handleRangeSelection(newIndex);
    }
    scrollToItem(newIndex);
  };

  const navigateLeft = (withSelection: boolean) => {
    // Implement grid navigation if needed
    navigateUp(withSelection);
  };

  const navigateRight = (withSelection: boolean) => {
    // Implement grid navigation if needed
    navigateDown(withSelection);
  };

  const navigateToStart = (withSelection: boolean) => {
    setFocusedIndex(0);
    if (withSelection) {
      handleRangeSelection(0);
    }
    scrollToItem(0);
  };

  const navigateToEnd = (withSelection: boolean) => {
    const lastIndex = items.length - 1;
    setFocusedIndex(lastIndex);
    if (withSelection) {
      handleRangeSelection(lastIndex);
    }
    scrollToItem(lastIndex);
  };

  const navigatePageUp = (withSelection: boolean) => {
    const pageSize = 10; // Adjust based on view
    const newIndex = Math.max(0, focusedIndex - pageSize);
    setFocusedIndex(newIndex);
    if (withSelection) {
      handleRangeSelection(newIndex);
    }
    scrollToItem(newIndex);
  };

  const navigatePageDown = (withSelection: boolean) => {
    const pageSize = 10; // Adjust based on view
    const newIndex = Math.min(items.length - 1, focusedIndex + pageSize);
    setFocusedIndex(newIndex);
    if (withSelection) {
      handleRangeSelection(newIndex);
    }
    scrollToItem(newIndex);
  };

  // Selection helpers
  const toggleSelection = (index: number) => {
    const item = items[index];
    if (!item) return;

    const newSelection = new Set(selectedItems);
    if (newSelection.has(item.id)) {
      newSelection.delete(item.id);
    } else {
      newSelection.add(item.id);
    }
    setSelectedItems(newSelection);
    setLastSelectedIndex(index);

    if (onSelect) {
      onSelect(Array.from(newSelection).map(id => items.find(i => i.id === id)));
    }
  };

  const handleRangeSelection = (newIndex: number) => {
    if (lastSelectedIndex === null) {
      toggleSelection(newIndex);
      return;
    }

    const start = Math.min(lastSelectedIndex, newIndex);
    const end = Math.max(lastSelectedIndex, newIndex);
    const newSelection = new Set(selectedItems);

    for (let i = start; i <= end; i++) {
      if (items[i]) {
        newSelection.add(items[i].id);
      }
    }

    setSelectedItems(newSelection);
    if (onSelect) {
      onSelect(Array.from(newSelection).map(id => items.find(i => i.id === id)));
    }
  };

  const selectAll = () => {
    const allIds = new Set(items.map(item => item.id));
    setSelectedItems(allIds);
    if (onSelect) {
      onSelect(items);
    }
    showToast('Selected All', `${items.length} items selected`);
  };

  // Scroll to item
  const scrollToItem = (index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const itemElement = container.querySelector(`[data-index="${index}"]`);
    if (itemElement) {
      itemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Toast notification helper
  const showToast = (title: string, description: string) => {
    toast({
      title,
      description,
    });
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Handle global shortcuts when container is focused
      if (containerRef.current && containerRef.current.contains(document.activeElement)) {
        return; // Let the component handler take care of it
      }

      // Global search shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && onSearch) {
        e.preventDefault();
        onSearch();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onSearch]);

  // Focus management
  useEffect(() => {
    const handleFocus = () => {
      // Ensure focused index is visible when component gains focus
      scrollToItem(focusedIndex);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('focus', handleFocus);
      return () => container.removeEventListener('focus', handleFocus);
    }
  }, [focusedIndex]);

  return (
    <div
      ref={containerRef}
      className={cn("outline-none", className)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="application"
      aria-label="Keyboard navigable content"
    >
      {children({
        focusedIndex,
        selectedItems,
        handleKeyDown,
        setFocusedIndex,
      })}
    </div>
  );
}

// Keyboard shortcut display component
interface KeyboardShortcutProps {
  shortcut: string | string[];
  description: string;
  className?: string;
}

export function KeyboardShortcut({ shortcut, description, className }: KeyboardShortcutProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut];

  const formatKey = (key: string) => {
    if (key === 'cmd' || key === 'meta') return isMac ? '⌘' : 'Ctrl';
    if (key === 'ctrl') return isMac ? '⌃' : 'Ctrl';
    if (key === 'alt') return isMac ? '⌥' : 'Alt';
    if (key === 'shift') return isMac ? '⇧' : 'Shift';
    if (key === 'enter') return '⏎';
    if (key === 'delete') return isMac ? '⌫' : 'Del';
    if (key === 'escape') return 'Esc';
    if (key === 'space') return 'Space';
    if (key === 'tab') return 'Tab';
    if (key === 'up') return '↑';
    if (key === 'down') return '↓';
    if (key === 'left') return '←';
    if (key === 'right') return '→';
    return key.toUpperCase();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {shortcuts.map((key, index) => (
          <kbd
            key={index}
            className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
          >
            {key.split('+').map((k, i) => (
              <span key={i}>{formatKey(k.trim())}</span>
            ))}
          </kbd>
        ))}
      </div>
    </div>
  );
}

// Keyboard shortcuts help panel
export function KeyboardShortcutsHelp({ className }: { className?: string }) {
  const shortcuts = [
    { category: 'Navigation', items: [
      { shortcut: 'up', description: 'Move up' },
      { shortcut: 'down', description: 'Move down' },
      { shortcut: 'left', description: 'Move left' },
      { shortcut: 'right', description: 'Move right' },
      { shortcut: 'home', description: 'Go to start' },
      { shortcut: 'end', description: 'Go to end' },
      { shortcut: 'page up', description: 'Page up' },
      { shortcut: 'page down', description: 'Page down' },
    ]},
    { category: 'Selection', items: [
      { shortcut: 'space', description: 'Select item' },
      { shortcut: 'shift+up', description: 'Extend selection up' },
      { shortcut: 'shift+down', description: 'Extend selection down' },
      { shortcut: 'cmd+a', description: 'Select all' },
      { shortcut: 'escape', description: 'Clear selection' },
    ]},
    { category: 'Actions', items: [
      { shortcut: 'enter', description: 'Open/Activate' },
      { shortcut: 'cmd+c', description: 'Copy' },
      { shortcut: 'cmd+v', description: 'Paste' },
      { shortcut: 'cmd+x', description: 'Cut' },
      { shortcut: 'delete', description: 'Delete' },
      { shortcut: 'cmd+z', description: 'Undo' },
      { shortcut: 'cmd+shift+z', description: 'Redo' },
    ]},
    { category: 'Search', items: [
      { shortcut: '/', description: 'Search' },
      { shortcut: 'cmd+k', description: 'Command palette' },
    ]},
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {shortcuts.map((category) => (
        <div key={category.category}>
          <h4 className="font-semibold text-sm mb-2">{category.category}</h4>
          <div className="space-y-1">
            {category.items.map((item) => (
              <KeyboardShortcut
                key={item.shortcut}
                shortcut={item.shortcut}
                description={item.description}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}