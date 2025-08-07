import { env } from '@/lib/env';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Log context interface
export interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  labId?: string;
  projectId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

// Logger configuration
const LOG_LEVELS: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

// Get current log level from environment
const CURRENT_LOG_LEVEL = LOG_LEVELS[env.LOG_LEVEL as LogLevel] || LOG_LEVELS[LogLevel.INFO];

// Logger class
class Logger {
  private context: LogContext = {};

  // Set context for all subsequent logs
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  // Clear context
  clearContext(): void {
    this.context = {};
  }

  // Create child logger with additional context
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  // Core logging method
  private log(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error
  ): void {
    // Check if should log based on level
    if (LOG_LEVELS[level] < CURRENT_LOG_LEVEL) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(data && { data }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
      environment: env.NODE_ENV,
      hostname: typeof window === 'undefined' ? process.env.HOSTNAME : window.location.hostname,
    };

    // Format and output log
    this.output(level, logEntry);

    // Send to monitoring service in production
    if (env.NODE_ENV === 'production') {
      this.sendToMonitoring(logEntry);
    }
  }

  // Output log to console or file
  private output(level: LogLevel, logEntry: any): void {
    const formatted = env.NODE_ENV === 'production'
      ? JSON.stringify(logEntry)
      : this.formatForDevelopment(level, logEntry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }
  }

  // Format log for development
  private formatForDevelopment(level: LogLevel, logEntry: any): string {
    const emoji = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: '📘',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.FATAL]: '💀',
    };

    const color = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[34m',  // Blue
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const { timestamp, level: _, message, error, data, ...context } = logEntry;

    let output = `${emoji[level]} ${color[level]}[${timestamp}] ${level.toUpperCase()}:${reset} ${message}`;

    if (Object.keys(context).length > 0) {
      output += `\n   Context: ${JSON.stringify(context, null, 2)}`;
    }

    if (data) {
      output += `\n   Data: ${JSON.stringify(data, null, 2)}`;
    }

    if (error) {
      output += `\n   Error: ${error.message}\n   Stack: ${error.stack}`;
    }

    return output;
  }

  // Send logs to monitoring service
  private async sendToMonitoring(logEntry: any): Promise<void> {
    try {
      // Sentry integration
      if (env.SENTRY_DSN && typeof window !== 'undefined') {
        const Sentry = (window as any).Sentry;
        if (Sentry) {
          if (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.FATAL) {
            Sentry.captureException(logEntry.error || new Error(logEntry.message), {
              contexts: {
                app: logEntry,
              },
            });
          } else {
            Sentry.captureMessage(logEntry.message, logEntry.level);
          }
        }
      }

      // Datadog or other service integration
      if (env.DATADOG_API_KEY) {
        // Send to Datadog
        await fetch('https://http-intake.logs.datadoghq.com/api/v2/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': env.DATADOG_API_KEY,
          },
          body: JSON.stringify(logEntry),
        }).catch(() => {
          // Silently fail to not affect application
        });
      }

      // Custom logging endpoint
      if (typeof window !== 'undefined') {
        await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry),
        }).catch(() => {
          // Silently fail
        });
      }
    } catch (error) {
      // Don't throw errors from logging
      console.error('Failed to send log to monitoring:', error);
    }
  }

  // Public logging methods
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | any, data?: any): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, message, data, error);
    } else {
      this.log(LogLevel.ERROR, message, { ...data, error });
    }
  }

  fatal(message: string, error?: Error | any, data?: any): void {
    if (error instanceof Error) {
      this.log(LogLevel.FATAL, message, data, error);
    } else {
      this.log(LogLevel.FATAL, message, { ...data, error });
    }
    
    // In fatal cases, you might want to exit the process (server-side only)
    if (typeof window === 'undefined' && env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // Performance logging
  time(label: string): void {
    if (typeof window !== 'undefined') {
      console.time(label);
    } else {
      (global as any)[`timer_${label}`] = Date.now();
    }
  }

  timeEnd(label: string): void {
    if (typeof window !== 'undefined') {
      console.timeEnd(label);
    } else {
      const start = (global as any)[`timer_${label}`];
      if (start) {
        const duration = Date.now() - start;
        this.info(`${label}: ${duration}ms`, { duration });
        delete (global as any)[`timer_${label}`];
      }
    }
  }

  // Audit logging for compliance
  audit(action: string, details: any): void {
    this.info(`AUDIT: ${action}`, {
      ...details,
      auditTimestamp: new Date().toISOString(),
      auditAction: action,
    });
  }

  // Security logging
  security(event: string, details: any): void {
    this.warn(`SECURITY: ${event}`, {
      ...details,
      securityEvent: event,
      securityTimestamp: new Date().toISOString(),
    });
  }
}

// Create singleton instance
const logger = new Logger();

// Export logger instance and factory
export { logger };

// Create logger with context
export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}

// Express/Next.js middleware for request logging
export function requestLogger() {
  return (req: any, res: any, next: any) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const start = Date.now();

    // Create logger with request context
    const reqLogger = createLogger({
      requestId,
      userId: req.user?.id,
      sessionId: req.session?.id,
    });

    // Attach logger to request
    req.logger = reqLogger;

    // Log request
    reqLogger.info('Request received', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Log response
    const originalSend = res.send;
    res.send = function(data: any) {
      const duration = Date.now() - start;
      
      reqLogger.info('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
}

// Performance monitoring helper
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (!start) {
      logger.warn(`Performance mark '${startMark}' not found`);
      return 0;
    }

    const duration = (end || performance.now()) - start;
    
    logger.debug(`Performance: ${name}`, {
      duration: `${duration.toFixed(2)}ms`,
      startMark,
      endMark,
    });

    return duration;
  }

  clear(): void {
    this.marks.clear();
  }
}

// Export performance monitor instance
export const perfMonitor = new PerformanceMonitor();

// Database query logging
export function logQuery(query: string, params?: any[], duration?: number): void {
  logger.debug('Database query', {
    query: query.substring(0, 500), // Truncate long queries
    params: params?.slice(0, 10), // Limit params logged
    duration: duration ? `${duration}ms` : undefined,
  });
}

// API call logging
export function logApiCall(
  method: string,
  url: string,
  status: number,
  duration: number,
  error?: Error
): void {
  const logData = {
    method,
    url,
    status,
    duration: `${duration}ms`,
  };

  if (error) {
    logger.error('API call failed', error, logData);
  } else if (status >= 400) {
    logger.warn('API call returned error status', logData);
  } else {
    logger.debug('API call completed', logData);
  }
}

// Business metrics logging
export function logMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): void {
  logger.info('Metric', {
    metricName: name,
    metricValue: value,
    metricUnit: unit,
    metricTags: tags,
  });
}