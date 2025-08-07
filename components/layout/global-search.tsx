"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  Search,
  Command,
  Folder,
  Beaker,
  CheckSquare,
  Lightbulb,
  User,
  Calendar,
  Loader2,
  ChevronRight,
  X,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLab } from "@/lib/contexts/lab-context";

// Types - following TypeScript best practices
interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: SearchResultType;
  url: string;
  metadata?: SearchMetadata;
}

interface SearchMetadata {
  status?: string;
  bucket?: string;
  bucketColor?: string;
  projectName?: string;
  category?: string;
  stage?: string;
  voteScore?: number;
  email?: string;
  role?: string;
  initials?: string;
  type?: string;
  dueDate?: string;
  priority?: string;
  isOverdue?: boolean;
  projectCount?: number;
}

type SearchResultType = 'project' | 'bucket' | 'task' | 'idea' | 'user' | 'deadline';

interface SearchConfig {
  minQueryLength: number;
  debounceDelay: number;
  maxResults: number;
  searchEndpoint: string;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  config?: Partial<SearchConfig>;
  onSearch?: (query: string) => void;
  onResultSelect?: (result: SearchResult) => void;
}

// Configuration with defaults - no hardcoded values in component
const DEFAULT_CONFIG: SearchConfig = {
  minQueryLength: 2,
  debounceDelay: 300,
  maxResults: 20,
  searchEndpoint: '/api/search',
};

// Type configuration - centralized for easy updates
const SEARCH_TYPE_CONFIG: Record<SearchResultType, {
  icon: LucideIcon;
  color: string;
  label: string;
}> = {
  project: {
    icon: Beaker,
    color: "text-blue-500",
    label: "Projects",
  },
  bucket: {
    icon: Folder,
    color: "text-purple-500",
    label: "Buckets",
  },
  task: {
    icon: CheckSquare,
    color: "text-green-500",
    label: "Tasks",
  },
  idea: {
    icon: Lightbulb,
    color: "text-yellow-500",
    label: "Ideas",
  },
  user: {
    icon: User,
    color: "text-gray-500",
    label: "Team Members",
  },
  deadline: {
    icon: Calendar,
    color: "text-red-500",
    label: "Deadlines",
  },
};

// Keyboard shortcuts configuration
const KEYBOARD_SHORTCUTS = {
  open: { key: 'k', modifiers: ['meta', 'ctrl'] },
  close: 'Escape',
  navigateDown: 'ArrowDown',
  navigateUp: 'ArrowUp',
  select: 'Enter',
} as const;

// Search Result Item Component - Memoized for performance
const SearchResultItem = memo(({
  result,
  isSelected,
  onClick,
  onMouseEnter,
}: {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) => {
  const config = SEARCH_TYPE_CONFIG[result.type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-full flex items-center px-3 py-2 text-left",
        "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        "focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800",
        isSelected && "bg-gray-100 dark:bg-gray-800"
      )}
      role="option"
      aria-selected={isSelected}
      data-testid={`search-result-${result.type}-${result.id}`}
    >
      <Icon 
        className={cn("h-4 w-4 mr-3 flex-shrink-0", config.color)} 
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
          {result.title}
        </div>
        {result.subtitle && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {result.subtitle}
          </div>
        )}
      </div>
      {result.metadata?.bucketColor && (
        <div 
          className="w-2 h-2 rounded-full ml-2 flex-shrink-0"
          style={{ backgroundColor: result.metadata.bucketColor }}
          aria-label={`Bucket color: ${result.metadata.bucket}`}
        />
      )}
      {result.metadata?.isOverdue && (
        <span className="ml-2 text-xs text-red-500 font-medium" aria-label="Overdue">
          OVERDUE
        </span>
      )}
      <ChevronRight className="h-3 w-3 ml-2 text-gray-400 flex-shrink-0" aria-hidden="true" />
    </button>
  );
});

SearchResultItem.displayName = 'SearchResultItem';

// Main Search Component
export function GlobalSearch({ 
  className,
  placeholder = "Search studies, tasks, buckets, or documents",
  config: userConfig = {},
  onSearch,
  onResultSelect,
}: GlobalSearchProps) {
  const router = useRouter();
  const { currentLab } = useLab();
  
  // Merge user config with defaults
  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...userConfig,
  }), [userConfig]);

  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [announcement, setAnnouncement] = useState<string>("");
  
  // Refs for DOM elements
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Debounced search query
  const debouncedQuery = useDebounce(query, config.debounceDelay);

  // Group results by type for better organization
  const groupedResults = useMemo(() => {
    return results.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);
  }, [results]);

  // Perform search with error handling and abort support
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < config.minQueryLength) {
      setResults([]);
      setError(null);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(currentLab && { labId: currentLab.id }),
        limit: config.maxResults.toString(),
      });

      const response = await fetch(`${config.searchEndpoint}?${params}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      
      // Announce results to screen readers
      const resultCount = data.length;
      const message = resultCount === 0 
        ? `No results found for ${searchQuery}`
        : `${resultCount} result${resultCount === 1 ? '' : 's'} found for ${searchQuery}`;
      setAnnouncement(message);

      // Call onSearch callback if provided
      onSearch?.(searchQuery);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Search error:', err);
        setError('Failed to perform search. Please try again.');
        setResults([]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [config, currentLab, onSearch]);

  // Effect to perform search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Open search with Cmd/Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === KEYBOARD_SHORTCUTS.open.key) {
      e.preventDefault();
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    // Handle navigation when open
    if (!isOpen) return;

    switch (e.key) {
      case KEYBOARD_SHORTCUTS.close:
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        setResults([]);
        setError(null);
        break;

      case KEYBOARD_SHORTCUTS.navigateDown:
        if (results.length > 0) {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % results.length);
        }
        break;

      case KEYBOARD_SHORTCUTS.navigateUp:
        if (results.length > 0) {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        }
        break;

      case KEYBOARD_SHORTCUTS.select:
        if (results.length > 0) {
          e.preventDefault();
          const selected = results[selectedIndex];
          if (selected) {
            handleResultClick(selected);
          }
        }
        break;
    }
  }, [isOpen, results, selectedIndex]);

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.querySelector('[aria-selected="true"]');
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, results]);

  // Handle result selection
  const handleResultClick = useCallback((result: SearchResult) => {
    // Call custom handler if provided
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Default behavior: navigate to result URL
      router.push(result.url);
    }
    
    // Clean up
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setError(null);
  }, [router, onResultSelect]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Handle query change
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  }, []);

  // Handle clear button
  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
    inputRef.current?.focus();
  }, []);

  return (
    <div 
      ref={searchRef} 
      className={cn("relative flex-1 max-w-xl", className)}
      data-testid="global-search"
    >
      {/* Accessibility announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Search Input */}
      <div
        className={cn(
          "relative flex items-center rounded-lg border transition-all",
          isFocused || isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-gray-300 dark:border-gray-700",
          error && "border-red-500 ring-2 ring-red-500/20"
        )}
      >
        <Search className="absolute left-3 h-4 w-4 text-gray-400" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-label="Search"
          aria-describedby={error ? "search-error" : undefined}
          value={query}
          onChange={handleQueryChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full bg-transparent py-2 pl-10 pr-20 text-sm outline-none placeholder:text-gray-400 dark:text-white"
          data-testid="search-input"
        />
        
        <div className="absolute right-3 flex items-center space-x-2">
          {/* Clear button */}
          {query && (
            <button
              onClick={handleClear}
              className="rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Clear search"
              data-testid="clear-search"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
          
          {/* Keyboard shortcut indicator */}
          <kbd 
            className="hidden rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 sm:inline-flex items-center"
            aria-label="Press Command K to open search"
          >
            <Command className="h-3 w-3 mr-0.5" aria-hidden="true" />K
          </kbd>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div 
          id="search-error"
          className="absolute top-full mt-1 text-xs text-red-500 flex items-center"
          role="alert"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && (query.length >= config.minQueryLength || results.length > 0) && !error && (
        <div 
          ref={resultsRef}
          id="search-results"
          className="absolute top-full mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 z-50 max-h-[400px] overflow-y-auto"
          role="listbox"
          aria-label="Search results"
          data-testid="search-results"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8" role="status">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" aria-label="Loading results" />
              <span className="sr-only">Loading search results...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {Object.entries(groupedResults).map(([type, items]) => {
                const config = SEARCH_TYPE_CONFIG[type as SearchResultType];
                
                return (
                  <div key={type} className="mb-2" role="group" aria-label={config.label}>
                    <div 
                      className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase"
                      id={`search-group-${type}`}
                    >
                      {config.label}
                    </div>
                    <div role="group" aria-labelledby={`search-group-${type}`}>
                      {items.map((result) => {
                        const globalIndex = results.indexOf(result);
                        const isSelected = globalIndex === selectedIndex;
                        
                        return (
                          <SearchResultItem
                            key={result.id}
                            result={result}
                            isSelected={isSelected}
                            onClick={() => handleResultClick(result)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : query.length >= config.minQueryLength ? (
            <div 
              className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
              role="status"
            >
              No results found for "{query}"
            </div>
          ) : null}

          {/* Keyboard navigation help */}
          {!isLoading && results.length > 0 && (
            <div 
              className="border-t border-gray-200 dark:border-gray-700 px-3 py-2"
              aria-label="Keyboard navigation help"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="sr-only">Keyboard navigation:</span>
                Press{' '}
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs" aria-label="Up arrow">↑</kbd>{' '}
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs" aria-label="Down arrow">↓</kbd>{' '}
                to navigate,{' '}
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs" aria-label="Enter">Enter</kbd>{' '}
                to select,{' '}
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs" aria-label="Escape">Esc</kbd>{' '}
                to close
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}