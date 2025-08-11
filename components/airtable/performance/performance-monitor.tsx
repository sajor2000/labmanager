'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Activity, Zap, HardDrive, Wifi, AlertTriangle,
  TrendingUp, TrendingDown, Minus, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Performance metrics types
interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    limit: number;
    percent: number;
  };
  network: {
    latency: number;
    bandwidth: number;
  };
  renderTime: number;
  componentCount: number;
  updateCount: number;
  longTasks: number;
}

interface PerformanceEntry {
  timestamp: number;
  metrics: PerformanceMetrics;
}

// Performance Observer API wrapper
class PerformanceObserverManager {
  private observer: PerformanceObserver | null = null;
  private entries: PerformanceEntry[] = [];
  private callbacks: Set<(metrics: PerformanceMetrics) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initObserver();
    }
  }

  private initObserver() {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.processEntry(entry);
        });
      });

      // Observe different entry types
      this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource', 'longtask'] });
    } catch (error) {
      console.error('Failed to initialize PerformanceObserver:', error);
    }
  }

  private processEntry(entry: PerformanceEntry) {
    // Process performance entries and calculate metrics
    const metrics = this.calculateMetrics();
    this.notifyCallbacks(metrics);
  }

  private calculateMetrics(): PerformanceMetrics {
    const fps = this.calculateFPS();
    const memory = this.getMemoryUsage();
    const network = this.getNetworkMetrics();
    const renderTime = this.getRenderTime();

    return {
      fps,
      memory,
      network,
      renderTime,
      componentCount: this.getComponentCount(),
      updateCount: this.getUpdateCount(),
      longTasks: this.getLongTaskCount(),
    };
  }

  private calculateFPS(): number {
    // Calculate FPS based on frame timing
    const now = performance.now();
    const recentEntries = this.entries.filter(
      e => now - e.timestamp < 1000
    );
    return Math.min(60, recentEntries.length);
  }

  private getMemoryUsage() {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return {
        used: mem.usedJSHeapSize,
        limit: mem.jsHeapSizeLimit,
        percent: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100,
      };
    }
    return { used: 0, limit: 0, percent: 0 };
  }

  private getNetworkMetrics() {
    // Get network timing from Navigation Timing API
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (nav) {
      return {
        latency: nav.responseStart - nav.fetchStart,
        bandwidth: this.estimateBandwidth(),
      };
    }
    return { latency: 0, bandwidth: 0 };
  }

  private estimateBandwidth(): number {
    // Estimate bandwidth from resource timings
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    if (resources.length === 0) return 0;

    const recent = resources.slice(-10);
    const totalSize = recent.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalTime = recent.reduce((sum, r) => sum + (r.responseEnd - r.startTime), 0);

    return totalTime > 0 ? (totalSize / totalTime) * 1000 : 0; // bytes per second
  }

  private getRenderTime(): number {
    const measures = performance.getEntriesByType('measure');
    const renderMeasure = measures.find(m => m.name.includes('render'));
    return renderMeasure ? renderMeasure.duration : 0;
  }

  private getComponentCount(): number {
    // This would integrate with React DevTools API
    return 0;
  }

  private getUpdateCount(): number {
    // Track React updates
    return 0;
  }

  private getLongTaskCount(): number {
    const longTasks = performance.getEntriesByType('longtask');
    return longTasks.length;
  }

  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.add(callback);
  }

  unsubscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.delete(callback);
  }

  private notifyCallbacks(metrics: PerformanceMetrics) {
    this.callbacks.forEach(callback => callback(metrics));
  }

  mark(name: string) {
    performance.mark(name);
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }
  }

  clearMarks(name?: string) {
    performance.clearMarks(name);
  }

  clearMeasures(name?: string) {
    performance.clearMeasures(name);
  }
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: { used: 0, limit: 0, percent: 0 },
    network: { latency: 0, bandwidth: 0 },
    renderTime: 0,
    componentCount: 0,
    updateCount: 0,
    longTasks: 0,
  });
  
  const observerRef = useRef<PerformanceObserverManager>();

  useEffect(() => {
    observerRef.current = new PerformanceObserverManager();
    
    const handleMetrics = (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);
    };

    observerRef.current.subscribe(handleMetrics);

    // Update metrics periodically
    const interval = setInterval(() => {
      // Trigger metrics calculation
      observerRef.current?.mark('metrics-update');
    }, 1000);

    return () => {
      observerRef.current?.unsubscribe(handleMetrics);
      clearInterval(interval);
    };
  }, []);

  const mark = useCallback((name: string) => {
    observerRef.current?.mark(name);
  }, []);

  const measure = useCallback((name: string, startMark: string, endMark?: string) => {
    observerRef.current?.measure(name, startMark, endMark);
  }, []);

  return { metrics, mark, measure };
}

// Performance Monitor Component
interface PerformanceMonitorProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export function PerformanceMonitor({
  show = true,
  position = 'bottom-right',
  className,
}: PerformanceMonitorProps) {
  const { metrics } = usePerformanceMonitor();
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<PerformanceEntry[]>([]);

  useEffect(() => {
    const entry: PerformanceEntry = {
      timestamp: Date.now(),
      metrics,
    };
    setHistory(prev => [...prev.slice(-59), entry]); // Keep last 60 entries
  }, [metrics]);

  if (!show) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
    }
  };

  const getFPSStatus = (fps: number) => {
    if (fps >= 55) return { color: 'text-green-500', icon: <TrendingUp className="h-3 w-3" /> };
    if (fps >= 30) return { color: 'text-yellow-500', icon: <Minus className="h-3 w-3" /> };
    return { color: 'text-red-500', icon: <TrendingDown className="h-3 w-3" /> };
  };

  const getMemoryStatus = (percent: number) => {
    if (percent < 50) return 'bg-green-500';
    if (percent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const fpsStatus = getFPSStatus(metrics.fps);

  if (!isExpanded) {
    return (
      <div
        className={cn(
          "fixed z-50 bg-background/95 backdrop-blur border rounded-lg shadow-lg p-2",
          getPositionClasses(),
          className
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-auto p-1"
        >
          <div className="flex items-center gap-2 text-xs">
            <Activity className="h-3 w-3" />
            <span className={fpsStatus.color}>{metrics.fps} FPS</span>
            <span className="text-muted-foreground">|</span>
            <HardDrive className="h-3 w-3" />
            <span>{metrics.memory.percent.toFixed(0)}%</span>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "fixed z-50 w-80",
        getPositionClasses(),
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Monitor
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-6 w-6 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* FPS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Frame Rate
            </span>
            <span className={cn("flex items-center gap-1", fpsStatus.color)}>
              {fpsStatus.icon}
              {metrics.fps} FPS
            </span>
          </div>
          <Progress value={(metrics.fps / 60) * 100} className="h-1" />
        </div>

        {/* Memory */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              Memory
            </span>
            <span>
              {(metrics.memory.used / 1024 / 1024).toFixed(0)}MB / 
              {(metrics.memory.limit / 1024 / 1024).toFixed(0)}MB
            </span>
          </div>
          <Progress 
            value={metrics.memory.percent} 
            className={cn("h-1", getMemoryStatus(metrics.memory.percent))}
          />
        </div>

        {/* Network */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Network
            </span>
            <span>
              {metrics.network.latency.toFixed(0)}ms / 
              {(metrics.network.bandwidth / 1024).toFixed(1)}KB/s
            </span>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-xs space-y-1">
                  <span className="text-muted-foreground">Render Time</span>
                  <p className="font-mono">{metrics.renderTime.toFixed(2)}ms</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Time to render components</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-xs space-y-1">
                  <span className="text-muted-foreground">Long Tasks</span>
                  <p className="font-mono flex items-center gap-1">
                    {metrics.longTasks}
                    {metrics.longTasks > 0 && (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    )}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Tasks blocking main thread &gt;50ms</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Mini Chart */}
        <div className="h-12 flex items-end gap-0.5">
          {history.slice(-30).map((entry, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/20"
              style={{
                height: `${(entry.metrics.fps / 60) * 100}%`,
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Web Vitals tracking
export function trackWebVitals(metric: any) {
  // Send to analytics
  console.log('Web Vital:', metric);
  
  // You would send this to your analytics service
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_label: metric.id,
      non_interaction: true,
    });
  }
}

// React profiler integration
export function ProfilerWrapper({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const onRenderCallback = useCallback(
    (
      id: string,
      phase: 'mount' | 'update',
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number,
      interactions: Set<any>
    ) => {
      // Log render performance
      if (actualDuration > 16) {
        // Longer than one frame (16ms)
        console.warn(`Slow render in ${id}:`, {
          phase,
          actualDuration,
          baseDuration,
        });
      }
    },
    []
  );

  return (
    <React.Profiler id={id} onRender={onRenderCallback}>
      {children}
    </React.Profiler>
  );
}