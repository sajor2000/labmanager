# Complete Vercel + Prisma Postgres Setup Guide

## ✅ Configuration Checklist

Your project is correctly configured for Prisma Postgres on Vercel:

### 1. **Prisma Schema** ✅
- Uses `PRISMA_DATABASE_URL` for Accelerate connection
- Uses `DATABASE_URL` for direct connection (migrations)
- Provider set to `postgresql`

### 2. **Package.json Scripts** ✅
- `postinstall`: Uses `--no-engine` flag
- `build`: Includes `prisma generate --no-engine`
- `vercel-build`: Configured correctly

### 3. **Prisma Client** ✅
- Detects Prisma Accelerate URLs automatically
- Uses `withAccelerate()` extension
- Handles both direct and Accelerate connections

## 🚀 Deployment Steps

### Step 1: Set Up Vercel Project

1. **Install Vercel CLI** (if not already installed):
```bash
npm i -g vercel
```

2. **Link your project**:
```bash
vercel link
```

### Step 2: Configure Environment Variables in Vercel

Go to your [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables

Add these variables:

| Variable | Value | Environment |
|----------|-------|------------|
| `DATABASE_URL` | `postgres://...` (your direct connection) | Production, Preview, Development |
| `POSTGRES_URL` | Same as DATABASE_URL | Production, Preview, Development |
| `PRISMA_DATABASE_URL` | `prisma+postgres://accelerate...` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | Production |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |

### Step 3: Push Database Schema

```bash
# Pull environment variables locally
vercel env pull .env.local

# Push schema to database
npx prisma db push

# Optional: Seed database
npx prisma db seed
```

### Step 4: Deploy

**Option A: Deploy via CLI**
```bash
vercel --prod
```

**Option B: Auto-deploy via GitHub**
```bash
git push origin main
```

## 🔍 Verify Configuration

### Check Local Setup:
```bash
# Test database connection
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

### Check Production:
1. Visit your Vercel deployment URL
2. Check browser console for errors
3. Monitor Vercel Functions logs

## 🛠 Troubleshooting

### Common Issues:

#### 1. "Cannot find module '@prisma/client'"
**Solution**: Ensure `postinstall` script runs:
```json
"postinstall": "prisma generate --no-engine"
```

#### 2. "Invalid prisma:// URL"
**Solution**: Check `PRISMA_DATABASE_URL` starts with:
- `prisma://` or
- `prisma+postgres://`

#### 3. Build Fails on Vercel
**Solution**: Check build command:
```json
"vercel-build": "prisma generate --no-engine && next build"
```

#### 4. Database Connection Timeout
**Solution**: Ensure all 3 URLs are set:
- `DATABASE_URL`
- `POSTGRES_URL`
- `PRISMA_DATABASE_URL`

## 📊 Monitoring

### Prisma Accelerate Dashboard
- View query performance
- Monitor connection pool
- Check cache hit rates

### Vercel Dashboard
- Function logs
- Build logs
- Error tracking

## 🔒 Security Best Practices

1. **Never commit `.env` files**
2. **Rotate credentials regularly**
3. **Use strong `NEXTAUTH_SECRET`**
4. **Enable Vercel security headers** (already configured in vercel.json)

## 📚 Resources

- [Prisma Postgres Docs](https://www.prisma.io/docs/postgres)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Prisma Accelerate](https://www.prisma.io/accelerate)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

## ✨ Features Enabled

With this setup, you get:
- ⚡ Edge caching with Prisma Accelerate
- 🔄 Connection pooling
- 🚀 Serverless compatibility
- 📈 Query performance insights
- 🛡️ Built-in security headers
- 🔍 Automatic error tracking

## 🎉 Ready to Deploy!

Your application is fully configured for Prisma Postgres on Vercel. Simply run:

```bash
vercel --prod
```

Or push to GitHub for automatic deployment!