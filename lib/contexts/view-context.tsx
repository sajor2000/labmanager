'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ViewType, ViewConfiguration, SortOptions, StudyFilters } from '@/types';
import { safeLocalStorage } from '@/lib/utils/browser';

interface ViewState {
  // Current view configuration
  currentView: ViewConfiguration | null;
  viewType: ViewType;
  
  // Filters
  filters: StudyFilters;
  filterCount: number;
  
  // Sorting
  sortOptions: SortOptions;
  
  // Grouping
  groupBy: string | null;
  
  // Display preferences
  cardSize: 'small' | 'medium' | 'large';
  showEmptyGroups: boolean;
  showCompletedItems: boolean;
  
  // Color scheme
  colorBy: 'status' | 'priority' | 'bucket' | 'assignee' | null;
  
  // Saved views
  savedViews: ViewConfiguration[];
  
  // Collaboration
  activeCollaborators: string[];
  
  // UI State
  isSidebarOpen: boolean;
  isFilterPanelOpen: boolean;
  selectedRecordIds: string[];
}

interface ViewContextValue extends ViewState {
  // View management
  setCurrentView: (view: ViewConfiguration) => void;
  setViewType: (type: ViewType) => void;
  saveCurrentView: (name: string) => Promise<void>;
  deleteView: (viewId: string) => Promise<void>;
  loadView: (viewId: string) => Promise<void>;
  
  // Filter actions
  setFilters: (filters: StudyFilters) => void;
  clearFilters: () => void;
  addFilter: (key: keyof StudyFilters, value: any) => void;
  removeFilter: (key: keyof StudyFilters) => void;
  
  // Sort actions
  setSortOptions: (options: SortOptions) => void;
  clearSort: () => void;
  
  // Grouping actions
  setGroupBy: (field: string | null) => void;
  
  // Display preferences
  setCardSize: (size: 'small' | 'medium' | 'large') => void;
  toggleShowEmptyGroups: () => void;
  toggleShowCompletedItems: () => void;
  setColorBy: (field: 'status' | 'priority' | 'bucket' | 'assignee' | null) => void;
  
  // Selection
  selectRecord: (id: string) => void;
  deselectRecord: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
  
  // UI State
  toggleSidebar: () => void;
  toggleFilterPanel: () => void;
  
  // Collaboration
  updateActiveCollaborators: (users: string[]) => void;
}

const ViewContext = createContext<ViewContextValue | undefined>(undefined);

export function useViewContext() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useViewContext must be used within a ViewProvider');
  }
  return context;
}

interface ViewProviderProps {
  children: React.ReactNode;
  initialView?: ViewConfiguration;
  workspaceId?: string;
  tableId?: string;
}

export function ViewProvider({ 
  children, 
  initialView,
  workspaceId = 'default',
  tableId = 'projects'
}: ViewProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Determine view type from pathname
  const getViewTypeFromPath = (path: string): ViewType => {
    if (path.includes('/stacked')) return 'KANBAN';
    if (path.includes('/grid')) return 'TABLE';
    if (path.includes('/timeline')) return 'TIMELINE';
    if (path.includes('/calendar')) return 'CALENDAR';
    if (path.includes('/gantt')) return 'GANTT';
    if (path.includes('/form')) return 'FORM';
    if (path.includes('/gallery')) return 'GALLERY';
    return 'KANBAN'; // Default
  };
  
  const [state, setState] = useState<ViewState>({
    currentView: initialView || null,
    viewType: getViewTypeFromPath(pathname),
    filters: {},
    filterCount: 0,
    sortOptions: { field: 'createdAt', direction: 'desc' },
    groupBy: 'bucket',
    cardSize: 'medium',
    showEmptyGroups: true,
    showCompletedItems: true,
    colorBy: 'status',
    savedViews: [],
    activeCollaborators: [],
    isSidebarOpen: true,
    isFilterPanelOpen: false,
    selectedRecordIds: [],
  });
  
  // Load saved views from safeLocalStorage or API
  useEffect(() => {
    const loadSavedViews = async () => {
      try {
        // Try to load from safeLocalStorage first
        const localViews = safeLocalStorage.getItem(`views_${workspaceId}_${tableId}`);
        if (localViews) {
          const parsed = JSON.parse(localViews);
          setState(prev => ({ ...prev, savedViews: parsed }));
        }
        
        // Then fetch from API
        const response = await fetch(`/api/views?workspaceId=${workspaceId}&tableId=${tableId}`);
        if (response.ok) {
          const views = await response.json();
          setState(prev => ({ ...prev, savedViews: views }));
          // Update safeLocalStorage
          safeLocalStorage.setItem(`views_${workspaceId}_${tableId}`, JSON.stringify(views));
        }
      } catch (error) {
        console.error('Error loading saved views:', error);
      }
    };
    
    loadSavedViews();
  }, [workspaceId, tableId]);
  
  // Save preferences to safeLocalStorage whenever they change
  useEffect(() => {
    const preferences = {
      cardSize: state.cardSize,
      showEmptyGroups: state.showEmptyGroups,
      showCompletedItems: state.showCompletedItems,
      colorBy: state.colorBy,
      isSidebarOpen: state.isSidebarOpen,
    };
    safeLocalStorage.setItem('viewPreferences', JSON.stringify(preferences));
  }, [state.cardSize, state.showEmptyGroups, state.showCompletedItems, state.colorBy, state.isSidebarOpen]);
  
  // Calculate filter count
  useEffect(() => {
    let count = 0;
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length > 0) count++;
        else if (typeof value === 'string' && value.length > 0) count++;
        else if (typeof value === 'object') count++;
      }
    });
    setState(prev => ({ ...prev, filterCount: count }));
  }, [state.filters]);
  
  // View management
  const setCurrentView = useCallback((view: ViewConfiguration) => {
    setState(prev => ({ ...prev, currentView: view }));
  }, []);
  
  const setViewType = useCallback((type: ViewType) => {
    setState(prev => ({ ...prev, viewType: type }));
    
    // Navigate to appropriate route
    const viewRoutes: Record<ViewType, string> = {
      KANBAN: '/stacked',
      TABLE: '/grid',
      TIMELINE: '/timeline',
      CALENDAR: '/calendar',
      GANTT: '/gantt',
      FORM: '/form',
      GALLERY: '/gallery',
      MAP: '/map',
    };
    
    const route = viewRoutes[type];
    if (route) {
      router.push(route);
    }
  }, [router]);
  
  const saveCurrentView = useCallback(async (name: string) => {
    const newView: ViewConfiguration = {
      id: `view_${Date.now()}`,
      name,
      viewType: state.viewType,
      entityType: tableId,
      userId: 'current_user', // Replace with actual user ID
      labId: 'current_lab', // Replace with actual lab ID
      config: {
        filters: state.filters,
        sortOptions: state.sortOptions,
        groupBy: state.groupBy,
        cardSize: state.cardSize,
        showEmptyGroups: state.showEmptyGroups,
        showCompletedItems: state.showCompletedItems,
        colorBy: state.colorBy,
      },
      isDefault: false,
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      // Save to API
      const response = await fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newView),
      });
      
      if (response.ok) {
        const savedView = await response.json();
        setState(prev => ({
          ...prev,
          savedViews: [...prev.savedViews, savedView],
          currentView: savedView,
        }));
        
        // Update safeLocalStorage
        const updatedViews = [...state.savedViews, savedView];
        safeLocalStorage.setItem(`views_${workspaceId}_${tableId}`, JSON.stringify(updatedViews));
      }
    } catch (error) {
      console.error('Error saving view:', error);
    }
  }, [state, tableId, workspaceId]);
  
  const deleteView = useCallback(async (viewId: string) => {
    try {
      const response = await fetch(`/api/views/${viewId}`, { method: 'DELETE' });
      if (response.ok) {
        setState(prev => ({
          ...prev,
          savedViews: prev.savedViews.filter(v => v.id !== viewId),
          currentView: prev.currentView?.id === viewId ? null : prev.currentView,
        }));
        
        // Update safeLocalStorage
        const updatedViews = state.savedViews.filter(v => v.id !== viewId);
        safeLocalStorage.setItem(`views_${workspaceId}_${tableId}`, JSON.stringify(updatedViews));
      }
    } catch (error) {
      console.error('Error deleting view:', error);
    }
  }, [state.savedViews, workspaceId, tableId]);
  
  const loadView = useCallback(async (viewId: string) => {
    const view = state.savedViews.find(v => v.id === viewId);
    if (view) {
      setState(prev => ({
        ...prev,
        currentView: view,
        viewType: view.viewType,
        filters: view.config.filters || {},
        sortOptions: view.config.sortOptions || { field: 'createdAt', direction: 'desc' },
        groupBy: view.config.groupBy || null,
        cardSize: view.config.cardSize || 'medium',
        showEmptyGroups: view.config.showEmptyGroups ?? true,
        showCompletedItems: view.config.showCompletedItems ?? true,
        colorBy: view.config.colorBy || null,
      }));
      
      // Navigate to appropriate view type
      setViewType(view.viewType);
    }
  }, [state.savedViews, setViewType]);
  
  // Filter actions
  const setFilters = useCallback((filters: StudyFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }));
  }, []);
  
  const addFilter = useCallback((key: keyof StudyFilters, value: any) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }));
  }, []);
  
  const removeFilter = useCallback((key: keyof StudyFilters) => {
    setState(prev => {
      const { [key]: _, ...rest } = prev.filters;
      return { ...prev, filters: rest };
    });
  }, []);
  
  // Sort actions
  const setSortOptions = useCallback((options: SortOptions) => {
    setState(prev => ({ ...prev, sortOptions: options }));
  }, []);
  
  const clearSort = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      sortOptions: { field: 'createdAt', direction: 'desc' } 
    }));
  }, []);
  
  // Grouping
  const setGroupBy = useCallback((field: string | null) => {
    setState(prev => ({ ...prev, groupBy: field }));
  }, []);
  
  // Display preferences
  const setCardSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setState(prev => ({ ...prev, cardSize: size }));
  }, []);
  
  const toggleShowEmptyGroups = useCallback(() => {
    setState(prev => ({ ...prev, showEmptyGroups: !prev.showEmptyGroups }));
  }, []);
  
  const toggleShowCompletedItems = useCallback(() => {
    setState(prev => ({ ...prev, showCompletedItems: !prev.showCompletedItems }));
  }, []);
  
  const setColorBy = useCallback((field: 'status' | 'priority' | 'bucket' | 'assignee' | null) => {
    setState(prev => ({ ...prev, colorBy: field }));
  }, []);
  
  // Selection
  const selectRecord = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedRecordIds: [...prev.selectedRecordIds, id]
    }));
  }, []);
  
  const deselectRecord = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedRecordIds: prev.selectedRecordIds.filter(i => i !== id)
    }));
  }, []);
  
  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedRecordIds: [] }));
  }, []);
  
  const selectAll = useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, selectedRecordIds: ids }));
  }, []);
  
  // UI State
  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  }, []);
  
  const toggleFilterPanel = useCallback(() => {
    setState(prev => ({ ...prev, isFilterPanelOpen: !prev.isFilterPanelOpen }));
  }, []);
  
  // Collaboration
  const updateActiveCollaborators = useCallback((users: string[]) => {
    setState(prev => ({ ...prev, activeCollaborators: users }));
  }, []);
  
  const contextValue: ViewContextValue = {
    ...state,
    setCurrentView,
    setViewType,
    saveCurrentView,
    deleteView,
    loadView,
    setFilters,
    clearFilters,
    addFilter,
    removeFilter,
    setSortOptions,
    clearSort,
    setGroupBy,
    setCardSize,
    toggleShowEmptyGroups,
    toggleShowCompletedItems,
    setColorBy,
    selectRecord,
    deselectRecord,
    clearSelection,
    selectAll,
    toggleSidebar,
    toggleFilterPanel,
    updateActiveCollaborators,
  };
  
  return (
    <ViewContext.Provider value={contextValue}>
      {children}
    </ViewContext.Provider>
  );
}