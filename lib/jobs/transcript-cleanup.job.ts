import * as cron from 'node-cron';
import TranscriptArchiveService from '@/lib/services/transcript-archive.service';
import { logger } from '@/lib/utils/logger';

export class TranscriptCleanupJob {
  private static instance: TranscriptCleanupJob;
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TranscriptCleanupJob {
    if (!TranscriptCleanupJob.instance) {
      TranscriptCleanupJob.instance = new TranscriptCleanupJob();
    }
    return TranscriptCleanupJob.instance;
  }

  /**
   * Start the cleanup job
   * Runs daily at 2 AM by default
   */
  start(schedule: string = '0 2 * * *'): void {
    if (this.task) {
      logger.warn('Transcript cleanup job is already running');
      return;
    }

    // Validate cron expression
    if (!cron.validate(schedule)) {
      logger.error(`Invalid cron expression: ${schedule}`);
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    logger.info(`Starting transcript cleanup job with schedule: ${schedule}`);

    this.task = cron.schedule(schedule, async () => {
      await this.runCleanup();
    });

    // Also run cleanup on startup
    this.runCleanup();
  }

  /**
   * Stop the cleanup job
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Transcript cleanup job stopped');
    }
  }

  /**
   * Run the cleanup process
   */
  async runCleanup(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Cleanup is already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting transcript cleanup...');

      const result = await TranscriptArchiveService.cleanupExpiredTranscripts();

      const duration = Date.now() - startTime;

      logger.info('Transcript cleanup completed', {
        deletedCount: result.deletedCount,
        errors: result.errors.length,
        duration: `${duration}ms`,
      });

      if (result.errors.length > 0) {
        logger.error('Cleanup errors encountered:', {
          errors: result.errors,
        });
      }

      // Get archive stats after cleanup
      const stats = await TranscriptArchiveService.getArchiveStats();
      logger.info('Archive stats after cleanup:', stats);

    } catch (error) {
      logger.error('Transcript cleanup failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get job status
   */
  getStatus(): {
    isRunning: boolean;
    isScheduled: boolean;
    schedule?: string;
  } {
    return {
      isRunning: this.isRunning,
      isScheduled: this.task !== null,
      schedule: this.task ? 'Daily at 2 AM' : undefined,
    };
  }

  /**
   * Run cleanup manually (for admin interface)
   */
  async runManualCleanup(): Promise<{
    success: boolean;
    result?: {
      deletedCount: number;
      errors: string[];
    };
    error?: string;
  }> {
    if (this.isRunning) {
      return {
        success: false,
        error: 'Cleanup is already running',
      };
    }

    try {
      const result = await TranscriptArchiveService.cleanupExpiredTranscripts();
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cleanup failed',
      };
    }
  }
}

// Export singleton instance
export const transcriptCleanupJob = TranscriptCleanupJob.getInstance();

/**
 * Initialize the transcript cleanup job
 * This should be called when the application starts
 */
export function initializeTranscriptCleanupJob(): void {
  const schedule = process.env.TRANSCRIPT_CLEANUP_SCHEDULE || '0 2 * * *';
  
  try {
    transcriptCleanupJob.start(schedule);
  } catch (error) {
    logger.error('Failed to initialize transcript cleanup job:', error);
  }
}

/**
 * Gracefully shutdown the cleanup job
 * This should be called when the application is shutting down
 */
export function shutdownTranscriptCleanupJob(): void {
  transcriptCleanupJob.stop();
}