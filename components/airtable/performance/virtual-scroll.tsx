'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface VirtualScrollProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number, item: T) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number, scrollHeight: number) => void;
  estimatedItemHeight?: number;
  getItemKey?: (item: T, index: number) => string | number;
  headerHeight?: number;
  footerHeight?: number;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  renderPlaceholder?: (index: number) => React.ReactNode;
  horizontal?: boolean;
}

interface ItemMeta {
  offset: number;
  size: number;
}

export function VirtualScroll<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  onScroll,
  estimatedItemHeight = 50,
  getItemKey = (_, index) => index,
  headerHeight = 0,
  footerHeight = 0,
  renderHeader,
  renderFooter,
  renderPlaceholder,
  horizontal = false,
}: VirtualScrollProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const itemMetaMap = useRef<Map<number, ItemMeta>>(new Map());
  const measurementCache = useRef<Map<string | number, number>>(new Map());

  const isVariableHeight = typeof itemHeight === 'function';

  // Calculate item metadata
  const getItemMeta = useCallback((index: number): ItemMeta => {
    if (itemMetaMap.current.has(index)) {
      return itemMetaMap.current.get(index)!;
    }

    let offset = headerHeight;
    let size = estimatedItemHeight;

    if (isVariableHeight) {
      // Calculate offset by summing previous items
      for (let i = 0; i < index; i++) {
        const prevMeta = getItemMeta(i);
        offset += prevMeta.size;
      }
      
      // Get size for this item
      const item = items[index];
      const key = getItemKey(item, index);
      
      if (measurementCache.current.has(key)) {
        size = measurementCache.current.get(key)!;
      } else if (typeof itemHeight === 'function') {
        size = itemHeight(index, item);
        measurementCache.current.set(key, size);
      }
    } else {
      offset = headerHeight + index * (itemHeight as number);
      size = itemHeight as number;
    }

    const meta = { offset, size };
    itemMetaMap.current.set(index, meta);
    return meta;
  }, [items, itemHeight, isVariableHeight, estimatedItemHeight, headerHeight, getItemKey]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (items.length === 0) return headerHeight + footerHeight;
    
    const lastMeta = getItemMeta(items.length - 1);
    return lastMeta.offset + lastMeta.size + footerHeight;
  }, [items.length, getItemMeta, headerHeight, footerHeight]);

  // Calculate visible range
  const getVisibleRange = useCallback(() => {
    if (!scrollRef.current) return { start: 0, end: 0 };

    const scrollOffset = horizontal ? scrollRef.current.scrollLeft : scrollTop;
    const viewportSize = horizontal ? scrollRef.current.clientWidth : height;

    let start = 0;
    let end = items.length - 1;

    // Binary search for start
    let low = 0;
    let high = items.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const meta = getItemMeta(mid);
      
      if (meta.offset + meta.size < scrollOffset) {
        low = mid + 1;
      } else if (meta.offset > scrollOffset) {
        high = mid - 1;
      } else {
        start = mid;
        break;
      }
    }
    
    start = Math.max(0, low - overscan);

    // Find end
    for (let i = start; i < items.length; i++) {
      const meta = getItemMeta(i);
      if (meta.offset > scrollOffset + viewportSize) {
        end = i + overscan;
        break;
      }
    }

    return {
      start: Math.max(0, start),
      end: Math.min(items.length - 1, end),
    };
  }, [items.length, scrollTop, height, horizontal, getItemMeta, overscan]);

  const visibleRange = getVisibleRange();

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const newScrollTop = horizontal ? target.scrollLeft : target.scrollTop;
    
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    if (onScroll) {
      onScroll(newScrollTop, horizontal ? target.scrollWidth : target.scrollHeight);
    }
  }, [horizontal, onScroll]);

  // Clear cache when items change
  useEffect(() => {
    itemMetaMap.current.clear();
    measurementCache.current.clear();
  }, [items]);

  // Render visible items
  const visibleItems = [];
  for (let i = visibleRange.start; i <= visibleRange.end; i++) {
    const item = items[i];
    if (!item) continue;

    const meta = getItemMeta(i);
    const key = getItemKey(item, i);

    visibleItems.push(
      <div
        key={key}
        className="absolute"
        style={horizontal ? {
          left: meta.offset,
          width: meta.size,
          height: '100%',
        } : {
          top: meta.offset,
          height: meta.size,
          width: '100%',
        }}
      >
        {isScrolling && renderPlaceholder ? renderPlaceholder(i) : renderItem(item, i)}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
        "relative overflow-auto",
        horizontal ? "overflow-y-hidden" : "overflow-x-hidden",
        className
      )}
      style={horizontal ? { width: '100%', height } : { height }}
      onScroll={handleScroll}
    >
      <div
        className="relative"
        style={horizontal ? {
          width: totalHeight,
          height: '100%',
        } : {
          height: totalHeight,
          width: '100%',
        }}
      >
        {renderHeader && (
          <div
            className="absolute top-0 left-0 right-0"
            style={{ height: headerHeight }}
          >
            {renderHeader()}
          </div>
        )}
        
        {visibleItems}
        
        {renderFooter && (
          <div
            className="absolute bottom-0 left-0 right-0"
            style={horizontal ? {
              left: totalHeight - footerHeight,
              width: footerHeight,
            } : {
              top: totalHeight - footerHeight,
              height: footerHeight,
            }}
          >
            {renderFooter()}
          </div>
        )}
      </div>
    </div>
  );
}

// Virtual Grid component for 2D virtualization
interface VirtualGridProps<T> {
  items: T[];
  height: number;
  columnCount: number;
  rowHeight: number;
  columnWidth: number | ((index: number) => number);
  renderCell: (item: T, rowIndex: number, columnIndex: number) => React.ReactNode;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  height,
  columnCount,
  rowHeight,
  columnWidth,
  renderCell,
  gap = 0,
  overscan = 3,
  className,
}: VirtualGridProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const rowCount = Math.ceil(items.length / columnCount);
  const totalHeight = rowCount * (rowHeight + gap) - gap;
  
  const getColumnWidth = (index: number) => {
    return typeof columnWidth === 'function' ? columnWidth(index) : columnWidth;
  };

  const totalWidth = useMemo(() => {
    let width = 0;
    for (let i = 0; i < columnCount; i++) {
      width += getColumnWidth(i) + gap;
    }
    return width - gap;
  }, [columnCount, columnWidth, gap]);

  // Calculate visible range
  const visibleRowStart = Math.max(0, Math.floor(scrollTop / (rowHeight + gap)) - overscan);
  const visibleRowEnd = Math.min(
    rowCount - 1,
    Math.ceil((scrollTop + height) / (rowHeight + gap)) + overscan
  );

  const visibleColumnStart = 0; // For simplicity, always render all columns
  const visibleColumnEnd = columnCount - 1;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  };

  // Render visible cells
  const visibleCells = [];
  for (let row = visibleRowStart; row <= visibleRowEnd; row++) {
    let columnOffset = 0;
    
    for (let col = visibleColumnStart; col <= visibleColumnEnd; col++) {
      const index = row * columnCount + col;
      if (index >= items.length) break;

      const item = items[index];
      const width = getColumnWidth(col);

      visibleCells.push(
        <div
          key={`${row}-${col}`}
          className="absolute"
          style={{
            top: row * (rowHeight + gap),
            left: columnOffset,
            width,
            height: rowHeight,
          }}
        >
          {renderCell(item, row, col)}
        </div>
      );

      columnOffset += width + gap;
    }
  }

  return (
    <div
      ref={scrollRef}
      className={cn("relative overflow-auto", className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div
        className="relative"
        style={{
          height: totalHeight,
          width: totalWidth,
        }}
      >
        {visibleCells}
      </div>
    </div>
  );
}

// Window scroller for full-page virtual scrolling
interface WindowScrollerProps {
  children: (props: {
    scrollTop: number;
    isScrolling: boolean;
    height: number;
    width: number;
  }) => React.ReactNode;
  throttle?: number;
}

export function WindowScroller({ children, throttle = 10 }: WindowScrollerProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });
  const scrollTimeout = useRef<NodeJS.Timeout>();

  const debouncedScrollTop = useDebounce(scrollTop, throttle);

  useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY);
      setIsScrolling(true);

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    const handleResize = () => {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    handleResize();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return (
    <>
      {children({
        scrollTop: debouncedScrollTop,
        isScrolling,
        height: dimensions.height,
        width: dimensions.width,
      })}
    </>
  );
}

// Auto-sizer component
interface AutoSizerProps {
  children: (props: { width: number; height: number }) => React.ReactNode;
  className?: string;
}

export function AutoSizer({ children, className }: AutoSizerProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("h-full w-full", className)}>
      {dimensions.width > 0 && dimensions.height > 0 && children(dimensions)}
    </div>
  );
}