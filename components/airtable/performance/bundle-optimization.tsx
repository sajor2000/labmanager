'use client';

import dynamic from 'next/dynamic';
import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Code splitting with dynamic imports
export const DynamicKanbanBoard = dynamic(
  () => import('../kanban/enhanced-kanban-board').then(mod => mod.EnhancedKanbanBoard),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const DynamicFilterPanel = dynamic(
  () => import('../panels/filter-panel').then(mod => mod.FilterPanel),
  {
    loading: () => <LoadingSpinner />,
  }
);

export const DynamicRecordDetailPanel = dynamic(
  () => import('../panels/record-detail-panel').then(mod => mod.RecordDetailPanel),
  {
    loading: () => <LoadingSpinner />,
  }
);

export const DynamicFormModal = dynamic(
  () => import('../modals/form-modal').then(mod => mod.FormModal),
  {
    loading: () => <LoadingSpinner />,
  }
);

// Lazy load heavy components
export const LazyActivityFeed = lazy(() => 
  import('../collaboration/activity-feed').then(mod => ({ default: mod.ActivityFeed }))
);

export const LazyCommentSystem = lazy(() => 
  import('../collaboration/comment-system').then(mod => ({ default: mod.CommentSystem }))
);

export const LazyPresenceSystem = lazy(() => 
  import('../collaboration/presence-system').then(mod => ({ default: mod.PresenceSystem }))
);

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Wrapper for lazy components
export function LazyBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
}

// Tree shaking helper - only import what's needed
export { EnhancedKanbanBoard } from '../kanban/enhanced-kanban-board';
export type { EnhancedKanbanBoardProps } from '../kanban/enhanced-kanban-board';

// Re-export only necessary types
export type { ViewType, ViewConfiguration } from '@/types';

// Utility to preload components
export const preloadComponent = (
  componentName: 'kanban' | 'filter' | 'detail' | 'form' | 'activity' | 'comments' | 'presence'
) => {
  switch (componentName) {
    case 'kanban':
      import('../kanban/enhanced-kanban-board');
      break;
    case 'filter':
      import('../panels/filter-panel');
      break;
    case 'detail':
      import('../panels/record-detail-panel');
      break;
    case 'form':
      import('../modals/form-modal');
      break;
    case 'activity':
      import('../collaboration/activity-feed');
      break;
    case 'comments':
      import('../collaboration/comment-system');
      break;
    case 'presence':
      import('../collaboration/presence-system');
      break;
  }
};

// Resource hints for critical resources
export function ResourceHints() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://api.example.com" />
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    </>
  );
}

// Component registry for dynamic loading
const componentRegistry = new Map<string, React.ComponentType<any>>();

export async function registerComponent(name: string, loader: () => Promise<any>) {
  if (!componentRegistry.has(name)) {
    const module = await loader();
    componentRegistry.set(name, module.default || module);
  }
  return componentRegistry.get(name)!;
}

export function DynamicComponent({ 
  name, 
  fallback,
  ...props 
}: { 
  name: string; 
  fallback?: React.ReactNode;
  [key: string]: any;
}) {
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(
    () => componentRegistry.get(name) || null
  );

  React.useEffect(() => {
    if (!Component && name) {
      // Dynamically load based on name
      const loadComponent = async () => {
        try {
          const comp = await registerComponent(name, () => import(`../${name}`));
          setComponent(() => comp);
        } catch (error) {
          console.error(`Failed to load component: ${name}`, error);
        }
      };
      loadComponent();
    }
  }, [name, Component]);

  if (!Component) {
    return <>{fallback || <LoadingSpinner />}</>;
  }

  return <Component {...props} />;
}

// Optimize images
export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height,
  priority = false,
  ...props 
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  [key: string]: any;
}) {
  const [imageSrc, setImageSrc] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Generate optimized URL based on viewport
    const dpr = window.devicePixelRatio || 1;
    const quality = priority ? 90 : 75;
    const format = 'webp'; // Use WebP when supported

    // This would integrate with your image optimization service
    const optimizedUrl = `${src}?w=${width}&h=${height}&q=${quality}&dpr=${dpr}&fm=${format}`;
    
    if (priority) {
      // Load immediately for priority images
      setImageSrc(optimizedUrl);
      setIsLoading(false);
    } else {
      // Lazy load non-priority images
      const img = new Image();
      img.src = optimizedUrl;
      img.onload = () => {
        setImageSrc(optimizedUrl);
        setIsLoading(false);
      };
    }
  }, [src, width, height, priority]);

  if (isLoading && !priority) {
    return (
      <div 
        className="bg-gray-200 dark:bg-gray-700 animate-pulse"
        style={{ width, height }}
      />
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      {...props}
    />
  );
}

// Bundle size analyzer integration
export function reportBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    // This would integrate with webpack-bundle-analyzer or similar
    console.log('Bundle size analysis available at /_next/analyze');
  }
}

// Dead code elimination helper
export function eliminateDeadCode<T>(
  condition: boolean,
  component: T,
  fallback: T | null = null
): T | null {
  return condition ? component : fallback;
}

// Module federation support (for micro-frontends)
export async function loadRemoteModule(
  scope: string,
  module: string
): Promise<any> {
  // @ts-ignore
  await __webpack_init_sharing__('default');
  // @ts-ignore
  const container = window[scope];
  // @ts-ignore
  await container.init(__webpack_share_scopes__.default);
  // @ts-ignore
  const factory = await container.get(module);
  const Module = factory();
  return Module;
}

// Critical CSS extraction
export function CriticalStyles({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for above-the-fold content */
            .spinner {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            /* Add more critical styles here */
          `,
        }}
      />
      {children}
    </>
  );
}

// Service worker registration for offline support
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
}