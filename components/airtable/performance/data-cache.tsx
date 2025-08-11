'use client';

import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';

// Cache configuration
interface CacheConfig {
  staleTime?: number;
  cacheTime?: number;
  maxSize?: number;
  strategy?: 'LRU' | 'LFU' | 'FIFO';
}

// LRU Cache implementation
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Indexed DB wrapper for persistent cache
class PersistentCache {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'AirtableCache', storeName: string = 'data') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.init();
  }

  private async init() {
    if (!('indexedDB' in window)) return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async get(key: string): Promise<any> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiry > Date.now()) {
          resolve(result.value);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async set(key: string, value: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({
        key,
        value,
        expiry: Date.now() + ttl,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Cache Context
interface CacheContextValue {
  memoryCache: LRUCache<string, any>;
  persistentCache: PersistentCache;
  getCached: <T>(key: string, fetcher: () => Promise<T>, options?: CacheConfig) => Promise<T>;
  invalidate: (key: string | string[]) => void;
  prefetch: <T>(key: string, fetcher: () => Promise<T>) => void;
  clearCache: () => void;
}

const CacheContext = createContext<CacheContextValue | null>(null);

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const memoryCache = useRef(new LRUCache<string, any>(1000));
  const persistentCache = useRef(new PersistentCache());
  const queryClient = useQueryClient();

  const getCached = useCallback(async <T,>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheConfig = {}
  ): Promise<T> => {
    const { staleTime = 60000, cacheTime = 300000 } = options;

    // Check memory cache first
    const memCached = memoryCache.current.get(key);
    if (memCached && Date.now() - memCached.timestamp < staleTime) {
      return memCached.data;
    }

    // Check persistent cache
    const persistCached = await persistentCache.current.get(key);
    if (persistCached) {
      memoryCache.current.set(key, {
        data: persistCached,
        timestamp: Date.now(),
      });
      return persistCached;
    }

    // Fetch fresh data
    const data = await fetcher();
    
    // Update caches
    memoryCache.current.set(key, {
      data,
      timestamp: Date.now(),
    });
    await persistentCache.current.set(key, data, cacheTime);

    return data;
  }, []);

  const invalidate = useCallback((keys: string | string[]) => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    
    keyArray.forEach(key => {
      memoryCache.current.delete(key);
      persistentCache.current.delete(key);
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }, [queryClient]);

  const prefetch = useCallback(async <T,>(
    key: string,
    fetcher: () => Promise<T>
  ) => {
    const data = await fetcher();
    memoryCache.current.set(key, {
      data,
      timestamp: Date.now(),
    });
    await persistentCache.current.set(key, data);
  }, []);

  const clearCache = useCallback(() => {
    memoryCache.current.clear();
    persistentCache.current.clear();
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(() => ({
    memoryCache: memoryCache.current,
    persistentCache: persistentCache.current,
    getCached,
    invalidate,
    prefetch,
    clearCache,
  }), [getCached, invalidate, prefetch, clearCache]);

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within CacheProvider');
  }
  return context;
}

// Optimistic updates hook
export function useOptimisticUpdate<T>() {
  const queryClient = useQueryClient();

  const optimisticUpdate = useCallback((
    queryKey: any[],
    updater: (old: T) => T
  ) => {
    const previousData = queryClient.getQueryData<T>(queryKey);
    
    if (previousData) {
      queryClient.setQueryData(queryKey, updater(previousData));
    }

    return () => {
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData);
      }
    };
  }, [queryClient]);

  return optimisticUpdate;
}

// Cached query hook
interface CachedQueryOptions<T> {
  queryKey: any[];
  queryFn: () => Promise<T>;
  staleTime?: number;
  cacheTime?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useCachedQuery<T>({
  queryKey,
  queryFn,
  staleTime = 60000,
  cacheTime = 300000,
  enabled = true,
  onSuccess,
  onError,
}: CachedQueryOptions<T>) {
  const { getCached } = useCache();

  return useQuery({
    queryKey,
    queryFn: () => getCached(queryKey.join('-'), queryFn, { staleTime, cacheTime }),
    staleTime,
    gcTime: cacheTime,
    enabled,
    // @ts-ignore - React Query v5 compatibility
    onSuccess,
    onError,
  });
}

// Mutation with cache invalidation
interface CachedMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys?: any[][];
  optimisticUpdate?: (variables: TVariables) => void;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

export function useCachedMutation<TData = unknown, TVariables = void>({
  mutationFn,
  invalidateKeys = [],
  optimisticUpdate,
  onSuccess,
  onError,
}: CachedMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const { invalidate } = useCache();

  return useMutation({
    mutationFn,
    onMutate: optimisticUpdate,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      invalidateKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
        invalidate(key.join('-'));
      });
      
      onSuccess?.(data, variables);
    },
    onError,
  });
}

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export function dedupedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// Batch request handler
class BatchQueue<T> {
  private queue: Array<{
    key: string;
    resolve: (value: T) => void;
    reject: (error: any) => void;
  }> = [];
  private timer: NodeJS.Timeout | null = null;
  private batchSize: number;
  private delay: number;
  private batchFn: (keys: string[]) => Promise<Map<string, T>>;

  constructor(
    batchFn: (keys: string[]) => Promise<Map<string, T>>,
    batchSize: number = 10,
    delay: number = 10
  ) {
    this.batchFn = batchFn;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      this.scheduleFlush();
    });
  }

  private scheduleFlush() {
    if (this.timer) return;

    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    const keys = batch.map(item => item.key);

    try {
      const results = await this.batchFn(keys);
      
      batch.forEach(({ key, resolve, reject }) => {
        if (results.has(key)) {
          resolve(results.get(key)!);
        } else {
          reject(new Error(`No result for key: ${key}`));
        }
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }
}

export function createBatchQueue<T>(
  batchFn: (keys: string[]) => Promise<Map<string, T>>,
  batchSize?: number,
  delay?: number
): BatchQueue<T> {
  return new BatchQueue(batchFn, batchSize, delay);
}