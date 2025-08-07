# Vercel Deployment Guide for LabSync

## 🚨 CRITICAL SECURITY NOTICE

**BEFORE DEPLOYING**: The original repository contained exposed API keys. These have been removed but you MUST regenerate all API keys before deployment.

## Prerequisites

1. **Regenerate All API Keys** (CRITICAL):
   - OpenAI API Key: Generate new key at https://platform.openai.com/api-keys
   - Resend API Key: Generate new key at https://resend.com/api-keys
   - Database credentials: Set up new Prisma Accelerate connection

2. **Database Setup**:
   - Set up PostgreSQL database (recommended: Neon, Supabase, or Railway)
   - Configure Prisma Accelerate for connection pooling: https://www.prisma.io/data-platform/accelerate
   - Run database migrations: `npx prisma migrate deploy`

## Vercel Environment Variables

Configure these in your Vercel dashboard (`Settings` > `Environment Variables`):

### Required Variables

```bash
# Database (Prisma Accelerate URL for production)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_ACCELERATE_API_KEY"

# Authentication
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# AI Services
OPENAI_API_KEY="sk-your-new-openai-api-key"
OPENAI_API_BASE_URL="https://api.openai.com/v1"
OPENAI_API_VERSION="2024-08-06"
OPENAI_API_MODEL="gpt-4o-mini"
OPENAI_API_MODEL_2="gpt-4o"

# Email Service
RESEND_API_KEY="re_your-new-resend-api-key"
EMAIL_FROM="your-email@domain.com"

# Application
NEXT_PUBLIC_APP_URL="https://your-app-name.vercel.app"
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_DEBUG="false"

# Optional: Cron Job Security
CRON_SECRET="generate-with: openssl rand -base64 32"
```

### Optional Variables

```bash
# Error Tracking
SENTRY_DSN="your-sentry-dsn"
SENTRY_AUTH_TOKEN="your-sentry-token"

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS="GA-XXXXXXXX"
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="your-analytics-id"
```

## Deployment Steps

### 1. Prepare Repository

```bash
# Ensure all secrets are removed from git history
git log --oneline | head -20  # Check recent commits
git push origin main
```

### 2. Deploy to Vercel

1. **Connect Repository**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select "Next.js" as framework preset

2. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Development Command: `npm run dev`

3. **Set Environment Variables**:
   - Go to `Settings` > `Environment Variables`
   - Add all required variables from above
   - Set for "Production", "Preview", and "Development" environments

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

### 3. Database Setup

```bash
# Run migrations on production database
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### 4. Verify Deployment

1. **Health Check**: Visit `https://your-app.vercel.app/api/health`
2. **Database Connection**: Check app functionality
3. **Email Service**: Test deadline reminders
4. **AI Services**: Test standup transcription

## Cron Jobs Configuration

The app includes a daily reminder cron job. Configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Security Checklist

- [ ] All API keys regenerated
- [ ] Environment variables set in Vercel (not in code)
- [ ] `.env` files not committed to git
- [ ] Database credentials secured
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] CRON_SECRET configured for cron job security
- [ ] Email domain configured in Resend
- [ ] Database connection uses SSL

## Performance Optimizations

1. **Database**:
   - Use Prisma Accelerate for connection pooling
   - Configure appropriate connection limits
   - Enable query logging in development only

2. **Caching**:
   - Static assets cached by Vercel CDN
   - API routes use appropriate cache headers
   - Database queries optimized with transactions

3. **Bundle Size**:
   - Code splitting enabled
   - Unused dependencies removed
   - Dynamic imports for heavy components

## Monitoring & Debugging

1. **Vercel Logs**:
   - View function logs: `vercel logs`
   - Real-time logs: `vercel logs --follow`

2. **Database Monitoring**:
   - Monitor connection pool usage
   - Track slow queries
   - Set up alerts for connection issues

3. **Error Tracking**:
   - Configure Sentry (optional)
   - Monitor API error rates
   - Set up uptime monitoring

## Post-Deployment Tasks

1. **Test Core Features**:
   - User authentication
   - Study creation and management
   - Task assignment and tracking
   - AI transcription (if configured)
   - Email notifications

2. **Performance Testing**:
   - Load test with expected user volume
   - Monitor database performance
   - Check memory usage in Vercel functions

3. **Security Review**:
   - Verify no secrets in git history
   - Test API endpoint authentication
   - Review CORS configurations

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify DATABASE_URL format
   - Check Prisma Accelerate configuration
   - Ensure migrations are deployed

2. **Build Failures**:
   - Check TypeScript errors: `npm run type-check`
   - Verify all dependencies installed
   - Review build logs in Vercel dashboard

3. **API Errors**:
   - Check environment variables are set
   - Verify API key permissions
   - Review function logs

### Environment-Specific Debugging

```bash
# Local development
npm run dev

# Preview deployment
vercel --prod=false

# Production deployment
vercel --prod
```

## Support

For issues or questions:
1. Check Vercel documentation: https://vercel.com/docs
2. Review Prisma guides: https://www.prisma.io/docs
3. Next.js deployment guide: https://nextjs.org/docs/deployment

---

**Remember**: Never commit real API keys or secrets to the repository. Always use environment variables for sensitive data.