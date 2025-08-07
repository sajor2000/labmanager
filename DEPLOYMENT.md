# Deployment Guide for LabSync on Vercel

## Prerequisites
- Vercel account
- Vercel CLI installed (`npm i -g vercel`)
- Prisma Postgres database (from Vercel)

## Step 1: Set Up Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

### Required Variables:
```
DATABASE_URL="postgres://[your-direct-postgres-url]"
POSTGRES_URL="postgres://[your-direct-postgres-url]"
PRISMA_DATABASE_URL="prisma+postgres://[your-accelerate-url]"
```

### Optional Variables:
```
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="[generate-secure-secret]"
RESEND_API_KEY="[your-resend-api-key]"
OPENAI_API_KEY="[your-openai-api-key]"
```

## Step 2: Deploy to Vercel

### Option A: Deploy via CLI
```bash
vercel --prod
```

### Option B: Deploy via Git
```bash
git push origin main
```

## Troubleshooting

### Navigation Not Working
- Clear browser cache
- Check console for errors
- Verify JavaScript is enabled

### Database Connection Issues
- Ensure all three database URLs are set in Vercel
- Check Prisma Accelerate is enabled
- Verify connection strings are correct
