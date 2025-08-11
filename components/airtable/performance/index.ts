// Virtual Scrolling
export { 
  VirtualScroll, 
  VirtualGrid, 
  WindowScroller, 
  AutoSizer 
} from './virtual-scroll';

// Lazy Loading
export {
  useIntersectionObserver,
  LazyLoad,
  LazyImage,
  InfiniteScroll,
  LazyComponent,
  ProgressiveEnhancement,
  LazyData,
  BatchLoader
} from './lazy-loading';

// Data Caching
export {
  CacheProvider,
  useCache,
  useOptimisticUpdate,
  useCachedQuery,
  useCachedMutation,
  dedupedFetch,
  createBatchQueue
} from './data-cache';

// Bundle Optimization
export {
  DynamicKanbanBoard,
  DynamicFilterPanel,
  DynamicRecordDetailPanel,
  DynamicFormModal,
  LazyActivityFeed,
  LazyCommentSystem,
  LazyPresenceSystem,
  LazyBoundary,
  preloadComponent,
  ResourceHints,
  DynamicComponent,
  OptimizedImage,
  CriticalStyles,
  registerServiceWorker
} from './bundle-optimization';

// Performance Monitoring
export {
  usePerformanceMonitor,
  PerformanceMonitor,
  trackWebVitals,
  ProfilerWrapper
} from './performance-monitor';