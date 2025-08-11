'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ImageOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Intersection Observer Hook
export function useIntersectionObserver<T extends HTMLElement>(
  options?: IntersectionObserverInit,
  triggerOnce = true
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<T>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || (triggerOnce && hasIntersected)) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasIntersected(true);
        if (triggerOnce) {
          observer.disconnect();
        }
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [options, triggerOnce, hasIntersected]);

  return { targetRef, isIntersecting, hasIntersected };
}

// Lazy Load Component
interface LazyLoadProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
}

export function LazyLoad({
  children,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  className,
}: LazyLoadProps) {
  const { targetRef, hasIntersected } = useIntersectionObserver<HTMLDivElement>(
    {
      threshold,
      rootMargin,
    },
    triggerOnce
  );

  return (
    <div ref={targetRef} className={className}>
      {hasIntersected ? (
        children
      ) : (
        placeholder || <Skeleton className="h-32 w-full" />
      )}
    </div>
  );
}

// Lazy Image Component
interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  fallback,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  className,
  style,
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { targetRef, hasIntersected } = useIntersectionObserver<HTMLDivElement>(
    {
      threshold,
      rootMargin,
    },
    true
  );

  useEffect(() => {
    if (!hasIntersected || !src) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [hasIntersected, src, onLoad, onError]);

  return (
    <div ref={targetRef} className={cn("relative", className)} style={style}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      
      {hasError ? (
        fallback || (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <ImageOff className="h-6 w-6 text-gray-400" />
          </div>
        )
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          style={style}
        />
      )}
    </div>
  );
}

// Infinite Scroll Component
interface InfiniteScrollProps {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  rootMargin?: string;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function InfiniteScroll({
  loadMore,
  hasMore,
  isLoading,
  threshold = 0.1,
  rootMargin = '100px',
  loader,
  endMessage,
  children,
  className,
}: InfiniteScrollProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { targetRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>(
    {
      threshold,
      rootMargin,
    },
    false
  );

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoadingMore && !isLoading) {
      setIsLoadingMore(true);
      loadMore().finally(() => {
        setIsLoadingMore(false);
      });
    }
  }, [isIntersecting, hasMore, isLoadingMore, isLoading, loadMore]);

  return (
    <div className={className}>
      {children}
      
      {hasMore && (
        <div ref={targetRef} className="py-4">
          {(isLoadingMore || isLoading) && (
            loader || (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )
          )}
        </div>
      )}
      
      {!hasMore && endMessage && (
        <div className="py-4 text-center text-muted-foreground">
          {endMessage}
        </div>
      )}
    </div>
  );
}

// Lazy Component with Dynamic Import
interface LazyComponentProps {
  load: () => Promise<{ default: React.ComponentType<any> }>;
  props?: any;
  fallback?: React.ReactNode;
  errorBoundary?: React.ReactNode;
  className?: string;
}

export function LazyComponent({
  load,
  props = {},
  fallback,
  errorBoundary,
  className,
}: LazyComponentProps) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { targetRef, hasIntersected } = useIntersectionObserver<HTMLDivElement>(
    {
      threshold: 0.1,
      rootMargin: '50px',
    },
    true
  );

  useEffect(() => {
    if (!hasIntersected) return;

    load()
      .then((module) => {
        setComponent(() => module.default);
        setIsLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
      });
  }, [hasIntersected, load]);

  return (
    <div ref={targetRef} className={className}>
      {isLoading && (fallback || <Skeleton className="h-32 w-full" />)}
      {hasError && (errorBoundary || <div>Error loading component</div>)}
      {Component && <Component {...props} />}
    </div>
  );
}

// Progressive Enhancement Component
interface ProgressiveEnhancementProps {
  basic: React.ReactNode;
  enhanced: React.ReactNode;
  trigger?: 'viewport' | 'interaction' | 'idle';
  className?: string;
}

export function ProgressiveEnhancement({
  basic,
  enhanced,
  trigger = 'viewport',
  className,
}: ProgressiveEnhancementProps) {
  const [isEnhanced, setIsEnhanced] = useState(false);
  const { targetRef, hasIntersected } = useIntersectionObserver<HTMLDivElement>(
    {
      threshold: 0.1,
      rootMargin: '50px',
    },
    true
  );

  useEffect(() => {
    if (trigger === 'viewport' && hasIntersected) {
      setIsEnhanced(true);
    } else if (trigger === 'idle') {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => setIsEnhanced(true));
      } else {
        setTimeout(() => setIsEnhanced(true), 1);
      }
    }
  }, [trigger, hasIntersected]);

  const handleInteraction = useCallback(() => {
    if (trigger === 'interaction') {
      setIsEnhanced(true);
    }
  }, [trigger]);

  return (
    <div
      ref={targetRef}
      className={className}
      onMouseEnter={trigger === 'interaction' ? handleInteraction : undefined}
      onFocus={trigger === 'interaction' ? handleInteraction : undefined}
    >
      {isEnhanced ? enhanced : basic}
    </div>
  );
}

// Data Fetching with Suspense
interface LazyDataProps<T> {
  fetcher: () => Promise<T>;
  children: (data: T) => React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  cacheKey?: string;
  cacheTime?: number;
  className?: string;
}

const dataCache = new Map<string, { data: any; timestamp: number }>();

export function LazyData<T>({
  fetcher,
  children,
  fallback,
  errorFallback,
  cacheKey,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  className,
}: LazyDataProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { targetRef, hasIntersected } = useIntersectionObserver<HTMLDivElement>(
    {
      threshold: 0.1,
      rootMargin: '100px',
    },
    true
  );

  useEffect(() => {
    if (!hasIntersected) return;

    // Check cache
    if (cacheKey) {
      const cached = dataCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data);
        setIsLoading(false);
        return;
      }
    }

    // Fetch data
    setIsLoading(true);
    fetcher()
      .then((result) => {
        setData(result);
        if (cacheKey) {
          dataCache.set(cacheKey, { data: result, timestamp: Date.now() });
        }
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [hasIntersected, fetcher, cacheKey, cacheTime]);

  return (
    <div ref={targetRef} className={className}>
      {isLoading && (fallback || <Skeleton className="h-32 w-full" />)}
      {error && (errorFallback || <div>Error: {error.message}</div>)}
      {data && children(data)}
    </div>
  );
}

// Batch Loader for Multiple Items
interface BatchLoaderProps<T> {
  items: T[];
  batchSize?: number;
  delay?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  placeholder?: React.ReactNode;
  className?: string;
}

export function BatchLoader<T>({
  items,
  batchSize = 10,
  delay = 100,
  renderItem,
  placeholder,
  className,
}: BatchLoaderProps<T>) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (loadedCount >= items.length) return;

    setIsLoading(true);
    timeoutRef.current = setTimeout(() => {
      setLoadedCount(prev => Math.min(prev + batchSize, items.length));
      setIsLoading(false);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadedCount, items.length, batchSize, delay]);

  const loadedItems = items.slice(0, loadedCount);
  const remainingCount = items.length - loadedCount;

  return (
    <div className={className}>
      {loadedItems.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
      
      {remainingCount > 0 && (
        <>
          {isLoading && placeholder}
          {!isLoading && (
            <button
              onClick={() => setLoadedCount(prev => Math.min(prev + batchSize, items.length))}
              className="w-full py-2 text-center text-primary hover:underline"
            >
              Load more ({remainingCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}