/**
 * Production-safe logger that only logs in development
 * Replaces direct console.log usage throughout the app
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, but in production send to monitoring service
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, send to error tracking service (Sentry, etc.)
      console.error(...args);
      // TODO: Add Sentry or other error tracking
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.warn(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment && isDebugEnabled) {
      console.debug(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.info(...args);
    }
  },
  
  table: (data: any) => {
    if (isDevelopment || isDebugEnabled) {
      console.table(data);
    }
  },
  
  time: (label: string) => {
    if (isDevelopment || isDebugEnabled) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment || isDebugEnabled) {
      console.timeEnd(label);
    }
  },
};

// Export a no-op logger for production builds
export const noopLogger = {
  log: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  info: () => {},
  table: () => {},
  time: () => {},
  timeEnd: () => {},
};