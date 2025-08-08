/**
 * Instrumentation file for initializing services and background jobs
 * This runs once when the Next.js server starts
 */

import { logger } from './lib/utils/production-logger';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run in Node.js runtime, not in Edge runtime
    const { initializeTranscriptCleanupJob } = await import('./lib/jobs/transcript-cleanup.job');
    
    // Initialize the transcript cleanup job
    logger.info('[Instrumentation] Initializing transcript cleanup job...');
    initializeTranscriptCleanupJob();
    
    // Register shutdown hook
    process.on('SIGTERM', async () => {
      logger.info('[Instrumentation] Shutting down transcript cleanup job...');
      const { shutdownTranscriptCleanupJob } = await import('./lib/jobs/transcript-cleanup.job');
      shutdownTranscriptCleanupJob();
    });
  }
}