import crypto from 'crypto';
import { headers } from 'next/headers';
import { logger } from '@/lib/monitoring/logger';

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join('; '),
};

// CSRF token generation and validation
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_HEADER = 'X-CSRF-Token';
  private static readonly TOKEN_COOKIE = 'csrf-token';

  // Generate CSRF token
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  // Validate CSRF token
  static async validateToken(request: Request): Promise<boolean> {
    // Skip validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    const headerToken = request.headers.get(this.TOKEN_HEADER);
    const cookieHeader = request.headers.get('cookie');
    const cookieToken = this.extractTokenFromCookie(cookieHeader);

    if (!headerToken || !cookieToken) {
      logger.security('CSRF token missing', {
        url: request.url,
        method: request.method,
        hasHeaderToken: !!headerToken,
        hasCookieToken: !!cookieToken,
      });
      return false;
    }

    const isValid = this.compareTokens(headerToken, cookieToken);
    
    if (!isValid) {
      logger.security('CSRF token mismatch', {
        url: request.url,
        method: request.method,
      });
    }

    return isValid;
  }

  // Extract token from cookie string
  private static extractTokenFromCookie(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;
    
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const csrfCookie = cookies.find(c => c.startsWith(`${this.TOKEN_COOKIE}=`));
    
    return csrfCookie ? csrfCookie.split('=')[1] : null;
  }

  // Constant-time comparison to prevent timing attacks
  private static compareTokens(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    return crypto.timingSafeEqual(
      Buffer.from(a),
      Buffer.from(b)
    );
  }
}

// Input sanitization
export class InputSanitizer {
  // Remove potentially dangerous HTML/JS
  static sanitizeHtml(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<\s*\/?\s*script\s*>/gi, '')
      .replace(/<\s*\/?\s*iframe\s*>/gi, '');
  }

  // Sanitize SQL input (basic - use parameterized queries instead)
  static sanitizeSql(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/xp_/gi, '')
      .replace(/sp_/gi, '');
  }

  // Sanitize file names
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '_')
      .substring(0, 255);
  }

  // Validate and sanitize URL
  static sanitizeUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      
      // Only allow http(s) protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }

      // Remove credentials
      parsed.username = '';
      parsed.password = '';

      return parsed.toString();
    } catch {
      return null;
    }
  }

  // Sanitize JSON input
  static sanitizeJson(input: any, maxDepth: number = 10): any {
    const sanitize = (obj: any, depth: number = 0): any => {
      if (depth > maxDepth) {
        throw new Error('Maximum object depth exceeded');
      }

      if (obj === null || obj === undefined) {
        return obj;
      }

      if (typeof obj === 'string') {
        return this.sanitizeHtml(obj);
      }

      if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item, depth + 1));
      }

      if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Sanitize keys too
          const sanitizedKey = this.sanitizeHtml(key);
          sanitized[sanitizedKey] = sanitize(value, depth + 1);
        }
        return sanitized;
      }

      return obj;
    };

    return sanitize(input);
  }
}

// Encryption utilities
export class Encryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly ITERATIONS = 100000;
  private static readonly KEY_LENGTH = 32;

  // Derive key from password
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEY_LENGTH, 'sha256');
  }

  // Encrypt data
  static encrypt(text: string, password: string): string {
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    
    return combined.toString('base64');
  }

  // Decrypt data
  static decrypt(encryptedText: string, password: string): string {
    const combined = Buffer.from(encryptedText, 'base64');
    
    // Extract components
    const salt = combined.slice(0, this.SALT_LENGTH);
    const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
    const tag = combined.slice(
      this.SALT_LENGTH + this.IV_LENGTH,
      this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
    );
    const encrypted = combined.slice(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
    
    const key = this.deriveKey(password, salt);
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(password, salt, this.ITERATIONS, 64, 'sha512');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [saltHex, hashHex] = hashedPassword.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const hash = Buffer.from(hashHex, 'hex');
    
    const verifyHash = crypto.pbkdf2Sync(password, salt, this.ITERATIONS, 64, 'sha512');
    
    return crypto.timingSafeEqual(hash, verifyHash);
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

// Session security
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours

  // Validate session
  static validateSession(session: any): boolean {
    if (!session || !session.createdAt || !session.lastActivity) {
      return false;
    }

    const now = Date.now();
    const createdAt = new Date(session.createdAt).getTime();
    const lastActivity = new Date(session.lastActivity).getTime();

    // Check session age
    if (now - createdAt > this.MAX_SESSION_AGE) {
      logger.security('Session expired - max age exceeded', {
        sessionId: session.id,
        age: now - createdAt,
      });
      return false;
    }

    // Check inactivity timeout
    if (now - lastActivity > this.SESSION_TIMEOUT) {
      logger.security('Session expired - inactivity timeout', {
        sessionId: session.id,
        inactivity: now - lastActivity,
      });
      return false;
    }

    return true;
  }

  // Regenerate session ID (prevent fixation attacks)
  static regenerateSessionId(session: any): string {
    const newId = Encryption.generateSecureToken();
    
    logger.security('Session ID regenerated', {
      oldSessionId: session.id,
      newSessionId: newId,
    });
    
    return newId;
  }
}

// API key management
export class APIKeyManager {
  private static readonly KEY_PREFIX = 'lab_';
  private static readonly KEY_LENGTH = 32;

  // Generate API key
  static generateAPIKey(): { key: string; hashedKey: string } {
    const rawKey = crypto.randomBytes(this.KEY_LENGTH).toString('hex');
    const key = `${this.KEY_PREFIX}${rawKey}`;
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
    
    return { key, hashedKey };
  }

  // Validate API key
  static validateAPIKey(providedKey: string, hashedKey: string): boolean {
    if (!providedKey.startsWith(this.KEY_PREFIX)) {
      return false;
    }

    const providedHash = crypto.createHash('sha256').update(providedKey).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(providedHash),
      Buffer.from(hashedKey)
    );
  }
}

// Permission checker
export class PermissionChecker {
  // Check if user has required permission
  static hasPermission(
    userPermissions: string[],
    requiredPermission: string
  ): boolean {
    // Check exact match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check wildcard permissions
    const parts = requiredPermission.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const wildcardPermission = parts.slice(0, i).join('.') + '.*';
      if (userPermissions.includes(wildcardPermission)) {
        return true;
      }
    }

    // Check admin override
    if (userPermissions.includes('admin.*') || userPermissions.includes('*')) {
      return true;
    }

    return false;
  }

  // Check multiple permissions (AND)
  static hasAllPermissions(
    userPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    return requiredPermissions.every(permission =>
      this.hasPermission(userPermissions, permission)
    );
  }

  // Check multiple permissions (OR)
  static hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    return requiredPermissions.some(permission =>
      this.hasPermission(userPermissions, permission)
    );
  }
}

// Content Security Policy builder
export class CSPBuilder {
  private directives: Map<string, Set<string>> = new Map();

  constructor() {
    // Set defaults
    this.addDirective('default-src', "'self'");
    this.addDirective('frame-ancestors', "'none'");
  }

  addDirective(directive: string, ...values: string[]): this {
    if (!this.directives.has(directive)) {
      this.directives.set(directive, new Set());
    }
    
    const directiveSet = this.directives.get(directive)!;
    values.forEach(value => directiveSet.add(value));
    
    return this;
  }

  build(): string {
    const policies: string[] = [];
    
    this.directives.forEach((values, directive) => {
      if (values.size > 0) {
        policies.push(`${directive} ${Array.from(values).join(' ')}`);
      }
    });
    
    return policies.join('; ');
  }
}

// Export security middleware
export function securityMiddleware(request: Request): Headers {
  const responseHeaders = new Headers();
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    responseHeaders.set(key, value);
  });
  
  // Generate and set CSRF token for state-changing requests
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const csrfToken = CSRFProtection.generateToken();
    responseHeaders.set('Set-Cookie', `csrf-token=${csrfToken}; HttpOnly; Secure; SameSite=Strict`);
  }
  
  return responseHeaders;
}