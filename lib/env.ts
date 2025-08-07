import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().startsWith('postgres').or(z.string().startsWith('prisma://')),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Email
  EMAIL_FROM: z.string().email().optional(),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // AI Services
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  
  // Feature Flags
  ENABLE_AI_FEATURES: z.coerce.boolean().default(false),
  ENABLE_EMAIL_NOTIFICATIONS: z.coerce.boolean().default(false),
  ENABLE_FILE_UPLOADS: z.coerce.boolean().default(false),
  
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60), // seconds
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  DATADOG_API_KEY: z.string().optional(),
  
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('LabManage Research Hub'),
});

// Type for validated environment variables
export type Env = z.infer<typeof envSchema>;

// Validate and export environment variables
let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors
      .filter(err => err.message.includes('Required'))
      .map(err => err.path.join('.'));
    
    const invalidVars = error.errors
      .filter(err => !err.message.includes('Required'))
      .map(err => `${err.path.join('.')}: ${err.message}`);
    
    console.error('❌ Environment validation failed:');
    
    if (missingVars.length > 0) {
      console.error('Missing required variables:', missingVars.join(', '));
    }
    
    if (invalidVars.length > 0) {
      console.error('Invalid variables:', invalidVars.join(', '));
    }
    
    // Only fail in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      // Use defaults in development
      console.warn('⚠️ Using default values for missing environment variables');
      env = {} as Env;
    }
  } else {
    throw error;
  }
}

// Export validated environment
export { env };

// Helper functions for environment checks
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';

// Feature flag helpers
export const isAIEnabled = () => env.ENABLE_AI_FEATURES;
export const isEmailEnabled = () => env.ENABLE_EMAIL_NOTIFICATIONS;
export const isFileUploadEnabled = () => env.ENABLE_FILE_UPLOADS;

// Get configuration based on environment
export function getConfig() {
  return {
    app: {
      name: env.NEXT_PUBLIC_APP_NAME,
      url: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    database: {
      url: env.DATABASE_URL,
    },
    auth: {
      secret: env.NEXTAUTH_SECRET,
      url: env.NEXTAUTH_URL,
    },
    email: {
      from: env.EMAIL_FROM || 'noreply@labmanage.app',
      resendApiKey: env.RESEND_API_KEY,
      smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
      },
    },
    ai: {
      openai: {
        apiKey: env.OPENAI_API_KEY,
      },
      anthropic: {
        apiKey: env.ANTHROPIC_API_KEY,
      },
    },
    storage: {
      aws: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        region: env.AWS_REGION || 'us-east-1',
      },
      s3: {
        bucketName: env.S3_BUCKET_NAME,
      },
    },
    rateLimit: {
      requests: env.RATE_LIMIT_REQUESTS,
      window: env.RATE_LIMIT_WINDOW,
    },
    logging: {
      level: env.LOG_LEVEL,
    },
    monitoring: {
      sentry: {
        dsn: env.SENTRY_DSN,
      },
      datadog: {
        apiKey: env.DATADOG_API_KEY,
      },
    },
  };
}