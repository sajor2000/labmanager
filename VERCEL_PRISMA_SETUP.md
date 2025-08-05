# Vercel Prisma Postgres with Accelerate Setup Guide

## ✅ Configuration Completed

Your application is now configured for **Vercel Prisma Postgres with Accelerate** for optimal performance and connection pooling.

### What's Been Updated:

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Custom output path: `../app/generated/prisma-client`
   - Added `directUrl` for migrations
   - Fixed all referential actions (Cascade, SetNull)

2. **Prisma Client** (`lib/prisma.ts`)
   - Using generated client from custom path
   - Extended with Prisma Accelerate for connection pooling
   - Global singleton pattern for development

3. **API Routes**
   - All routes use the Accelerated Prisma Client
   - Optimized for serverless functions

## 🚀 Setup Instructions

### Step 1: Ensure Environment Variables

Your `.env` file should have:
```env
# From Vercel Postgres
DATABASE_URL="postgres://default:YOUR_PASSWORD@YOUR_HOST.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgres://default:YOUR_PASSWORD@YOUR_HOST.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require"
```

### Step 2: Generate Prisma Client

```bash
# Generate with no-engine flag for Vercel
npx prisma generate --no-engine
```

### Step 3: Push Schema to Database

```bash
# Push schema to your Vercel Postgres
npx prisma db push
```

Or run migrations:
```bash
# Create and apply migrations
npx prisma migrate deploy
```

### Step 4: Seed the Database

```bash
# Seed with sample data
npx prisma db seed
```

### Step 5: Deploy to Vercel

```bash
# Deploy to production
vercel --prod
```

## 📊 Benefits of Prisma Accelerate

1. **Connection Pooling**: Automatically manages database connections
2. **Global Edge Caching**: Cached queries at edge locations
3. **Query Optimization**: Automatic query analysis and optimization
4. **Serverless Ready**: Perfect for Vercel's serverless functions
5. **No Connection Limits**: Handles connection pooling automatically

## 🔧 Key Configuration Details

### Custom Prisma Client Path
The generated client is now at:
```
/app/generated/prisma-client
```

This keeps it within the app directory for better Next.js compatibility.

### Import Pattern
```typescript
// Always import from the generated path
import { PrismaClient } from '@/app/generated/prisma-client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())
```

### Accelerated Queries
All queries now benefit from Accelerate:
```typescript
// Cached at edge locations
const users = await prisma.user.findMany({
  where: { email: { endsWith: "@rush.edu" } },
  cacheStrategy: { ttl: 60 } // Cache for 60 seconds
})
```

## 🎯 Performance Tips

1. **Use Caching**: Add cache strategies to frequently accessed data
   ```typescript
   await prisma.study.findMany({
     cacheStrategy: { ttl: 300 } // 5 minutes
   })
   ```

2. **Batch Operations**: Use transactions for multiple operations
   ```typescript
   await prisma.$transaction([
     prisma.study.create({ data: studyData }),
     prisma.task.createMany({ data: tasksData })
   ])
   ```

3. **Select Only Needed Fields**:
   ```typescript
   await prisma.user.findMany({
     select: { id: true, name: true, email: true }
   })
   ```

## 📝 Commands Reference

```bash
# Generate Prisma Client for Vercel
npx prisma generate --no-engine

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio

# Pull database schema
npx prisma db pull
```

## 🚨 Important Notes

1. **Always use `--no-engine` flag** when generating for Vercel
2. **Use `DATABASE_URL` for pooled connections** (default)
3. **Use `DATABASE_URL_UNPOOLED` for migrations** (direct connection)
4. **Generated client is in `/app/generated/prisma-client`** not node_modules
5. **Accelerate is automatically enabled** via the extension

## ✨ Next Steps

1. **Monitor Performance**: Check Vercel Analytics for query performance
2. **Add Caching**: Implement cache strategies for frequently accessed data
3. **Optimize Queries**: Use Prisma's query insights
4. **Scale Automatically**: Vercel + Accelerate handles scaling

Your application is now fully configured for production with Vercel Prisma Postgres and Accelerate! 🎉