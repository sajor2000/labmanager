# Vercel Deployment Guide for LabSync Research Platform

This guide walks you through deploying the LabSync Research Platform to Vercel with Prisma Postgres.

## Prerequisites

- Node.js 20.11.0 or later
- Vercel account (free tier works)
- Vercel CLI installed globally

## Step 1: Install Vercel CLI

If you haven't already, install the Vercel CLI:

```bash
npm install -g vercel
```

## Step 2: Link to Vercel Project

Connect your local application with a Vercel project:

```bash
vercel link
```

When prompted:
- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project? `N` (create new)
- Project name: `labmanager` (or your preference)
- Directory: `./` (current directory)

## Step 3: Set Up Prisma Postgres Database

### Option A: Use Existing Prisma Database (Current Setup)
Your project is already configured with a Prisma database. Skip to Step 4.

### Option B: Create New Vercel Postgres Database
1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to "Storage" tab
4. Click "Create Database" → Select "Postgres"
5. Choose a region close to your users
6. Create the database

## Step 4: Configure Environment Variables

### Pull from Vercel (if using Vercel Postgres):
```bash
vercel env pull .env.development.local
```

### Or manually add to Vercel Dashboard:
Go to your project settings → Environment Variables and add:

```bash
# Database (use your existing values from .env.local)
DATABASE_URL="postgres://..."
PRISMA_DATABASE_URL="prisma+postgres://..."
POSTGRES_URL="postgres://..."

# OpenAI
OPENAI_API_KEY="sk-proj-..."
OPENAI_API_BASE_URL="https://api.openai.com/v1"
OPENAI_API_VERSION="2024-08-06"
OPENAI_API_MODEL="gpt-4o-mini"
OPENAI_API_MODEL_2="gpt-4o"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="your-email@domain.com"

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="generate-a-secure-secret-for-production"

# App URL
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

To generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 5: Prepare Database

### Generate Prisma Client:
```bash
npx prisma generate
```

### Run Migrations:
```bash
npx prisma migrate deploy
```

### Seed Database (Optional):
```bash
npx prisma db seed
```

## Step 6: Build and Test Locally

Test the production build locally:

```bash
npm run build
npm run start
```

Visit http://localhost:3000 to verify everything works.

## Step 7: Deploy to Vercel

### First Deployment:
```bash
vercel
```

### Subsequent Deployments:
```bash
vercel --prod
```

## Step 8: Post-Deployment Setup

### 1. Update Environment Variables
After deployment, update these in Vercel dashboard:
- `NEXTAUTH_URL` → Your production URL
- `NEXT_PUBLIC_APP_URL` → Your production URL

### 2. Configure Custom Domain (Optional)
1. Go to project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 3. Enable Analytics (Optional)
1. Go to project → Analytics
2. Enable Web Analytics
3. Enable Speed Insights

## Troubleshooting

### Database Connection Issues
If you get database connection errors:

1. Ensure all database environment variables are set correctly
2. Check if database URLs are properly formatted
3. For Prisma Accelerate, ensure the API key is valid

### Build Errors
If build fails:

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Run `npm run build` locally to catch errors

### Migration Issues
If migrations fail:

1. Ensure `DATABASE_URL` points to direct connection (not pooled)
2. Run migrations locally first: `npx prisma migrate dev`
3. Use `npx prisma migrate deploy` for production

## Monitoring

### View Logs
```bash
vercel logs
```

### View Deployment Status
```bash
vercel ls
```

### Rollback if Needed
```bash
vercel rollback
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | Direct PostgreSQL connection | Yes |
| PRISMA_DATABASE_URL | Prisma Accelerate URL (pooled) | Optional |
| OPENAI_API_KEY | OpenAI API key for AI features | Yes |
| RESEND_API_KEY | Email service API key | Yes |
| EMAIL_FROM | Sender email address | Yes |
| NEXTAUTH_URL | Full URL of your app | Yes |
| NEXTAUTH_SECRET | Random secret for auth | Yes |
| NEXT_PUBLIC_APP_URL | Public app URL | Yes |

## Scripts Reference

```json
{
  "build": "next build",
  "vercel-build": "prisma generate && prisma migrate deploy && next build",
  "start": "next start",
  "dev": "next dev"
}
```

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Security Notes

⚠️ **Important**: Never commit `.env.local` or any file with real API keys to Git!

- Use Vercel's environment variables for production secrets
- Keep different secrets for development and production
- Rotate API keys regularly
- Use strong, unique values for NEXTAUTH_SECRET