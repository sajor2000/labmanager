# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in LabSync Research Platform, please follow these steps:

1. **DO NOT** open a public issue
2. Email the security team at: security@labmanage.app
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

We will acknowledge your email within 48 hours and provide a detailed response within 7 days.

## Security Measures

### Authentication & Authorization
- NextAuth.js for secure authentication
- Role-based access control (RBAC)
- Session management with secure cookies
- JWT tokens with expiration
- **✅ NEW: All DELETE endpoints require authentication**
- **✅ NEW: Resource ownership verification before modifications**
- **✅ NEW: Lab admin privileges for sensitive operations**

### Data Protection
- All sensitive data encrypted at rest
- TLS 1.3 for data in transit
- Database connection via SSL
- Environment variables for secrets
- **✅ NEW: Comprehensive audit logging for all CRUD operations**
- **✅ NEW: Soft deletes for recoverable data**

### Input Validation
- Zod schema validation on all inputs
- SQL injection prevention via Prisma ORM
- XSS protection through input sanitization
- CSRF token validation
- **✅ NEW: Cascade protection for parent entity deletion**
- **✅ NEW: Dependency checking before destructive operations**

### Rate Limiting
- 60 requests per minute per IP for general operations
- **✅ NEW: 5 DELETE requests per minute per IP (strict limit)**
- Automatic blocking of suspicious IPs
- DDoS protection via Cloudflare (production)
- **✅ NEW: Enhanced rate limiting with proper retry headers**
- **✅ NEW: Separate tracking for DELETE operations**

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- Referrer-Policy: strict-origin-when-cross-origin

### Monitoring & Logging
- Security event logging
- Failed authentication tracking
- Suspicious activity detection
- Error monitoring without exposing sensitive data
- **✅ NEW: AuditLog table tracking all CRUD operations**
- **✅ NEW: User attribution for every action**
- **✅ NEW: IP address and user agent logging**
- **✅ NEW: `/api/audit-logs` endpoint for audit history**

### Dependencies
- Regular security audits with `npm audit`
- Automated dependency updates via Dependabot
- Only using trusted npm packages
- Lock file for reproducible builds

## Best Practices for Contributors

### Code Review
- All PRs require security review
- No hardcoded secrets or credentials
- Follow OWASP guidelines

### Development
- Use environment variables for configuration
- Never commit .env files
- Sanitize all user inputs
- Use parameterized queries
- Implement proper error handling

### Testing
- Include security tests
- Test authentication flows
- Verify authorization checks
- Test rate limiting

## Compliance

The platform follows industry standards:
- OWASP Top 10 mitigation
- GDPR compliance for EU users
- HIPAA considerations for health research data
- SOC 2 Type II practices

## CRUD Operations Safety Features

### Delete Operation Safety
- **✅ Confirmation Dialogs**: All delete buttons show confirmation with item name
- **✅ Warning Text**: "This action cannot be undone" clearly displayed
- **✅ Destructive Styling**: Red colors and trash icons for visual clarity
- **✅ Soft Deletes**: Tasks, Ideas, Comments use soft delete for recovery
- **✅ Hard Delete Protection**: Studies, Buckets check for dependencies first
- **✅ Cascade Protection**: Parent entities verify no orphaned data

### Security Verification
Run the CRUD verification tool to audit all endpoints:
```bash
npx ts-node scripts/crud-verification.ts
```

## Security Checklist for Deployment

- [x] Authentication added to ALL 15 DELETE endpoints ✅
  - Tasks, Studies, Ideas, Comments, Buckets
  - Deadlines, Standups, Projects, Team
  - Users, Labs, Transcripts, Views, Logs, Lab Members
- [x] Authorization checks on resource modifications
- [x] Audit logging for all secured CRUD operations
- [x] Confirmation dialogs for destructive actions
- [x] Cascade protection for Studies, Projects, Buckets, Labs, Users
- [x] Soft delete for Tasks, Ideas, Comments, Deadlines, Team Members, Users, Labs
- [x] Rate limiting for DELETE operations (5/minute)
- [x] Recovery mechanism for soft-deleted items (Archive UI + API)
- [ ] All environment variables configured
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database backups configured
- [ ] Security headers configured
- [ ] Error logging without sensitive data
- [ ] Dependencies up to date
- [ ] Security monitoring enabled

## Contact

Security Team: security@labmanage.app
Bug Bounty Program: Coming soon

Last Updated: January 2025