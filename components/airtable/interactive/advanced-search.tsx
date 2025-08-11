'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, Filter, Hash, Calendar, User, 
  Tag, Type, Link2, ChevronDown, History,
  Star, Sparkles, Command
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { FieldType } from '../fields/field-types';
import { getFieldIcon } from '../fields/field-types';

interface SearchSuggestion {
  id: string;
  type: 'field' | 'value' | 'recent' | 'saved' | 'ai';
  label: string;
  value: string;
  fieldId?: string;
  fieldType?: FieldType;
  icon?: React.ReactNode;
  description?: string;
  count?: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters?: any[];
  createdAt: Date;
  isStarred?: boolean;
}

interface AdvancedSearchProps {
  fields: Array<{
    id: string;
    name: string;
    type: FieldType;
    searchable?: boolean;
  }>;
  recentSearches?: string[];
  savedSearches?: SavedSearch[];
  suggestions?: SearchSuggestion[];
  onSearch: (query: string, filters?: any) => void;
  onSaveSearch?: (name: string, query: string) => void;
  placeholder?: string;
  showCommandPalette?: boolean;
  className?: string;
}

const DEFAULT_SUGGESTIONS: SearchSuggestion[] = [
  {
    id: 'recent-1',
    type: 'recent',
    label: 'Status: In Progress',
    value: 'status:in_progress',
    icon: <History className="h-4 w-4" />,
  },
  {
    id: 'recent-2',
    type: 'recent',
    label: 'Due this week',
    value: 'due:this_week',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    id: 'ai-1',
    type: 'ai',
    label: 'High priority tasks',
    value: 'priority:high status:active',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'AI suggested',
  },
];

export function AdvancedSearch({
  fields,
  recentSearches = [],
  savedSearches = [],
  suggestions = DEFAULT_SUGGESTIONS,
  onSearch,
  onSaveSearch,
  placeholder = 'Search or filter...',
  showCommandPalette = true,
  className,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const searchableFields = fields.filter(f => f.searchable !== false);
  
  // Parse search query for field-specific searches
  const parseQuery = (q: string) => {
    const fieldPattern = /(\w+):(\S+)/g;
    const matches = [...q.matchAll(fieldPattern)];
    const filters: any[] = [];
    let cleanQuery = q;
    
    matches.forEach(match => {
      const [fullMatch, fieldName, value] = match;
      const field = fields.find(f => 
        f.name.toLowerCase() === fieldName.toLowerCase() ||
        f.id === fieldName
      );
      
      if (field) {
        filters.push({
          fieldId: field.id,
          fieldName: field.name,
          value,
        });
        cleanQuery = cleanQuery.replace(fullMatch, '').trim();
      }
    });
    
    return { query: cleanQuery, filters };
  };
  
  const handleSearch = (searchQuery = query) => {
    const { query: cleanQuery, filters } = parseQuery(searchQuery);
    setActiveFilters(filters);
    onSearch(cleanQuery, filters);
    setShowSuggestions(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      setQuery('');
      setActiveFilters([]);
      setShowSuggestions(false);
    }
    if (showCommandPalette && (e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandOpen(true);
    }
  };
  
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.value);
    handleSearch(suggestion.value);
  };
  
  const clearSearch = () => {
    setQuery('');
    setActiveFilters([]);
    onSearch('', []);
  };
  
  const removeFilter = (index: number) => {
    const newFilters = activeFilters.filter((_, i) => i !== index);
    setActiveFilters(newFilters);
    
    // Rebuild query without this filter
    const queryParts = newFilters.map(f => `${f.fieldName}:${f.value}`);
    const baseQuery = query.replace(/(\w+):(\S+)/g, '').trim();
    const newQuery = [...queryParts, baseQuery].filter(Boolean).join(' ');
    setQuery(newQuery);
    handleSearch(newQuery);
  };
  
  // Build smart suggestions based on context
  const getSmartSuggestions = (): SearchSuggestion[] => {
    const allSuggestions: SearchSuggestion[] = [];
    
    // Add recent searches
    recentSearches.slice(0, 3).forEach((search, i) => {
      allSuggestions.push({
        id: `recent-${i}`,
        type: 'recent',
        label: search,
        value: search,
        icon: <History className="h-4 w-4" />,
      });
    });
    
    // Add saved searches
    savedSearches.slice(0, 3).forEach((search) => {
      allSuggestions.push({
        id: search.id,
        type: 'saved',
        label: search.name,
        value: search.query,
        icon: search.isStarred ? 
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : 
          <Star className="h-4 w-4" />,
      });
    });
    
    // Add field suggestions based on query
    if (query.length > 0) {
      searchableFields.slice(0, 3).forEach((field) => {
        allSuggestions.push({
          id: `field-${field.id}`,
          type: 'field',
          label: `Search in ${field.name}`,
          value: `${field.id}:${query}`,
          fieldId: field.id,
          fieldType: field.type,
          icon: getFieldIcon(field.type, "h-4 w-4"),
        });
      });
    }
    
    // Add AI suggestions
    allSuggestions.push(...suggestions.filter(s => s.type === 'ai'));
    
    return allSuggestions;
  };
  
  return (
    <>
      <div className={cn("relative", className)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="pl-9 pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {showCommandPalette && (
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            )}
            {(query || activeFilters.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {activeFilters.map((filter, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="gap-1 pl-2 pr-1"
              >
                <span className="text-xs font-medium">{filter.fieldName}:</span>
                <span className="text-xs">{filter.value}</span>
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-lg overflow-hidden">
              <ScrollArea className="max-h-[300px]">
                <div className="p-2">
                  {query.length === 0 ? (
                    <>
                      {/* Quick Filters */}
                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                          Quick Filters
                        </p>
                        <div className="space-y-1">
                          {searchableFields.slice(0, 4).map((field) => (
                            <button
                              key={field.id}
                              onClick={() => {
                                setQuery(`${field.id}:`);
                                inputRef.current?.focus();
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                            >
                              {getFieldIcon(field.type, "h-4 w-4")}
                              <span className="text-sm">{field.name}</span>
                              <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <Separator className="my-2" />
                    </>
                  ) : null}
                  
                  {/* Smart Suggestions */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                      Suggestions
                    </p>
                    <div className="space-y-1">
                      {getSmartSuggestions().map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                        >
                          {suggestion.icon}
                          <div className="flex-1">
                            <p className="text-sm">{suggestion.label}</p>
                            {suggestion.description && (
                              <p className="text-xs text-muted-foreground">
                                {suggestion.description}
                              </p>
                            )}
                          </div>
                          {suggestion.count && (
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.count}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
      
      {/* Command Palette */}
      {showCommandPalette && (
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            <CommandGroup heading="Search Fields">
              {searchableFields.map((field) => (
                <CommandItem
                  key={field.id}
                  onSelect={() => {
                    setQuery(`${field.id}:`);
                    setCommandOpen(false);
                    inputRef.current?.focus();
                  }}
                >
                  {getFieldIcon(field.type, "h-4 w-4 mr-2")}
                  <span>Search in {field.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search, i) => (
                <CommandItem
                  key={i}
                  onSelect={() => {
                    setQuery(search);
                    handleSearch(search);
                    setCommandOpen(false);
                  }}
                >
                  <History className="h-4 w-4 mr-2" />
                  <span>{search}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            
            {savedSearches.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Saved Searches">
                  {savedSearches.map((search) => (
                    <CommandItem
                      key={search.id}
                      onSelect={() => {
                        setQuery(search.query);
                        handleSearch(search.query);
                        setCommandOpen(false);
                      }}
                    >
                      {search.isStarred ? (
                        <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <Star className="h-4 w-4 mr-2" />
                      )}
                      <span>{search.name}</span>
                      <CommandShortcut>
                        {new Date(search.createdAt).toLocaleDateString()}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </CommandDialog>
      )}
    </>
  );
}