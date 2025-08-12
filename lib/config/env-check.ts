/**
 * Environment Variable Validation
 * Ensures critical environment variables are configured properly
 */

type EnvVarConfig = {
  required: boolean;
  fallback?: string;
  description: string;
};

const ENV_VARS: Record<string, EnvVarConfig> = {
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL database connection string',
  },
  NEXTAUTH_URL: {
    required: true,
    fallback: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    description: 'NextAuth base URL for authentication',
  },
  NEXTAUTH_SECRET: {
    required: true,
    description: 'NextAuth secret for session encryption',
  },
  NEXT_PUBLIC_APP_URL: {
    required: false,
    fallback: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    description: 'Public application URL',
  },
};

/**
 * Validates environment variables and provides helpful error messages
 */
export function validateEnv(): Record<string, string | undefined> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const result: Record<string, string | undefined> = {};

  Object.entries(ENV_VARS).forEach(([key, config]) => {
    const value = process.env[key];

    if (!value) {
      if (config.required && !config.fallback) {
        errors.push(`Missing required environment variable: ${key} - ${config.description}`);
      } else if (config.required && config.fallback) {
        warnings.push(`Using fallback for ${key}: ${config.fallback}`);
        result[key] = config.fallback;
      } else if (config.fallback) {
        result[key] = config.fallback;
      }
    } else {
      result[key] = value;
    }
  });

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    if (warnings.length > 0) {
      console.warn('⚠️ Environment variable warnings:', warnings);
    }
  }

  // Throw errors in production for missing required vars
  if (errors.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment configuration error:\n${errors.join('\n')}`);
    } else {
      console.error('❌ Environment variable errors:', errors);
    }
  }

  return result;
}

/**
 * Get a safe environment variable with fallback
 */
export function getEnvVar(key: string, fallback?: string): string {
  return process.env[key] || fallback || '';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get the application base URL
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 
         (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
}

/**
 * Get the API base URL
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || getAppUrl();
}