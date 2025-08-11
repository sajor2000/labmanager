'use client';

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { motion, PanInfo, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TouchGestureProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onRotate?: (rotation: number) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPullToRefresh?: () => Promise<void>;
  swipeThreshold?: number;
  pinchThreshold?: number;
  longPressDelay?: number;
  className?: string;
}

export function TouchGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onRotate,
  onDoubleTap,
  onLongPress,
  onPullToRefresh,
  swipeThreshold = 50,
  pinchThreshold = 0.2,
  longPressDelay = 500,
  className,
}: TouchGestureProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialRotation, setInitialRotation] = useState<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const controls = useAnimation();
  const y = useMotionValue(0);
  const pullProgress = useTransform(y, [0, 100], [0, 1]);

  // Handle swipe gestures
  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Horizontal swipes
    if (Math.abs(offset.x) > swipeThreshold) {
      if (offset.x > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (offset.x < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    // Vertical swipes
    if (Math.abs(offset.y) > swipeThreshold) {
      if (offset.y > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (offset.y < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
    
    // Pull to refresh
    if (offset.y > 100 && onPullToRefresh && !isRefreshing) {
      handlePullToRefresh();
    } else {
      controls.start({ y: 0 });
    }
  };

  // Handle pull to refresh
  const handlePullToRefresh = async () => {
    if (!onPullToRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    controls.start({ y: 60 });
    
    try {
      await onPullToRefresh();
    } finally {
      setIsRefreshing(false);
      controls.start({ y: 0 });
    }
  };

  // Handle double tap
  const handleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;
    
    if (timeSinceLastTap < 300 && onDoubleTap) {
      onDoubleTap();
      setLastTap(0);
    } else {
      setLastTap(now);
    }
  };

  // Handle touch events for pinch and rotate
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start long press timer
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          onLongPress();
        }, longPressDelay);
      }
    } else if (e.touches.length === 2) {
      // Two finger touch - prepare for pinch/rotate
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate initial distance for pinch
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      setInitialDistance(Math.sqrt(dx * dx + dy * dy));
      
      // Calculate initial rotation
      setInitialRotation(Math.atan2(dy, dx) * 180 / Math.PI);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long press on move
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate current distance
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Handle pinch
      if (initialDistance && onPinch) {
        const scale = currentDistance / initialDistance;
        if (Math.abs(scale - 1) > pinchThreshold) {
          onPinch(scale);
        }
      }
      
      // Handle rotation
      if (initialRotation !== null && onRotate) {
        const currentRotation = Math.atan2(dy, dx) * 180 / Math.PI;
        const rotation = currentRotation - initialRotation;
        onRotate(rotation);
      }
    }
  };

  const handleTouchEnd = () => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Reset touch tracking
    setTouchStart(null);
    setInitialDistance(null);
    setInitialRotation(null);
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <motion.div
      className={cn("touch-manipulation", className)}
      drag
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      animate={controls}
      style={{ y }}
    >
      {/* Pull to refresh indicator */}
      {onPullToRefresh && (
        <motion.div
          className="absolute -top-12 left-1/2 -translate-x-1/2"
          style={{ opacity: pullProgress }}
        >
          <div className={cn(
            "h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center",
            isRefreshing && "animate-spin"
          )}>
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </motion.div>
      )}
      
      {children}
    </motion.div>
  );
}

// Swipeable Card Component
interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  threshold?: number;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 100,
  className,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragEnd = async (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (info.offset.x > threshold && onSwipeRight) {
      await controls.start({ x: 500, opacity: 0 });
      onSwipeRight();
      controls.set({ x: 0, opacity: 1 });
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      await controls.start({ x: -500, opacity: 0 });
      onSwipeLeft();
      controls.set({ x: 0, opacity: 1 });
    } else {
      controls.start({ x: 0 });
    }
  };
  
  const background = useTransform(
    x,
    [-threshold, 0, threshold],
    ['#ef4444', '#ffffff', '#10b981']
  );
  
  const leftActionOpacity = useTransform(
    x,
    [0, threshold],
    [0, 1]
  );
  
  const rightActionOpacity = useTransform(
    x,
    [-threshold, 0],
    [1, 0]
  );
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        {leftAction && (
          <motion.div style={{ opacity: rightActionOpacity }}>
            {leftAction}
          </motion.div>
        )}
        {rightAction && (
          <motion.div style={{ opacity: leftActionOpacity }} className="ml-auto">
            {rightAction}
          </motion.div>
        )}
      </div>
      
      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -threshold * 1.5, right: threshold * 1.5 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className={cn(
          "relative bg-background",
          isDragging && "cursor-grabbing"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Pinch to Zoom Component
interface PinchZoomProps {
  children: ReactNode;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

export function PinchZoom({
  children,
  minScale = 0.5,
  maxScale = 3,
  className,
}: PinchZoomProps) {
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let initialDistance = 0;
    let initialScale = 1;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
        initialScale = scale;
        
        // Set transform origin to center of pinch
        const rect = container.getBoundingClientRect();
        const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
        setOrigin({ x: centerX, y: centerY });
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        e.preventDefault();
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        const newScale = (currentDistance / initialDistance) * initialScale;
        setScale(Math.max(minScale, Math.min(maxScale, newScale)));
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(s => Math.max(minScale, Math.min(maxScale, s * delta)));
      }
    };
    
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scale, minScale, maxScale]);
  
  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden", className)}
    >
      <motion.div
        animate={{ scale }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          transformOrigin: `${origin.x}px ${origin.y}px`,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}