# 🚨 Vercel Deployment Error Fix

## The Problem
"Something went wrong" error when selecting "User Experience" on Vercel deployment.
This is happening because the database is not properly connected in production.

## Quick Fix Steps

### 1. Set Up Database (Choose One Option)

#### Option A: Prisma Accelerate (Recommended - Free Tier)
1. Go to [console.prisma.io](https://console.prisma.io)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select your database provider (or create a new one with Supabase)
5. Copy the **Accelerate connection string** (starts with `prisma://`)

#### Option B: Supabase (Free Tier)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the **Connection string** (URI)
5. Replace `[YOUR-PASSWORD]` with your actual password

#### Option C: Use Your Existing Database
If you already have a PostgreSQL database, use that connection string.

### 2. Add Environment Variables to Vercel

Go to your [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these variables:

```env
DATABASE_URL = "your_database_connection_string_here"
NEXTAUTH_SECRET = "generate_random_32_char_string"
NEXTAUTH_URL = "https://your-app.vercel.app"
NODE_ENV = "production"
```

**To generate NEXTAUTH_SECRET**, run this command locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Redeploy the Application

After adding environment variables:

1. Go to Deployments tab in Vercel
2. Click the three dots menu on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

### 4. Initialize Database (First Time Only)

If using a new database, you need to run migrations:

#### Method 1: Using Vercel CLI
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Pull environment variables
vercel env pull .env.production.local

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

#### Method 2: Direct Database Connection
```bash
# Set DATABASE_URL directly
export DATABASE_URL="your_connection_string"

# Run migrations
npx prisma migrate deploy

# Seed with test data
npx prisma db seed
```

## Common Issues & Solutions

### Issue 1: "Can't reach database server"
**Solution**: 
- If using Supabase/Neon, make sure to allow connections from all IPs (0.0.0.0/0)
- Check if SSL is required: Add `?sslmode=require` to connection string

### Issue 2: "relation does not exist"
**Solution**: 
- Database tables aren't created. Run migrations:
```bash
npx prisma migrate deploy
```

### Issue 3: "Invalid `prisma` invocation"
**Solution**:
- Prisma client not generated. Add to package.json:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Issue 4: Timeout errors
**Solution**:
- If using Prisma Accelerate, make sure you're using the Accelerate URL, not direct database URL
- Increase timeout in vercel.json:
```json
{
  "functions": {
    "app/api/users/route.ts": {
      "maxDuration": 30
    }
  }
}
```

## Quick Database Setup Script

Run this to quickly set up everything:

```bash
# 1. Create .env.production.local file
echo "DATABASE_URL=your_database_url_here" > .env.production.local

# 2. Generate Prisma Client
npx prisma generate

# 3. Push schema to database
npx prisma db push

# 4. Seed with sample data
npx prisma db seed

# 5. Verify connection
npx prisma db pull
```

## Verify It's Working

After redeployment:
1. Go to your Vercel app URL
2. Open browser console (F12)
3. Try selecting "User Experience" again
4. Check Network tab for `/api/users` request
5. Should return 200 with user data

## Still Having Issues?

Check Vercel Function Logs:
1. Go to Vercel Dashboard → Functions tab
2. Click on `api/users`
3. View logs for error details

The error details will tell you exactly what's wrong (usually database connection).

## Emergency Fix

If you need it working RIGHT NOW without a database:

1. Create `/app/api/users/route.ts` with mock data:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  // Return mock users for testing
  const mockUsers = [
    {
      id: "user1",
      name: "John Doe",
      email: "john@example.com",
      role: "ADMIN",
      labs: []
    },
    {
      id: "user2", 
      name: "Jane Smith",
      email: "jane@example.com",
      role: "USER",
      labs: []
    }
  ];
  
  return NextResponse.json(mockUsers);
}
```

2. Commit and push this change
3. This will make the app work while you set up the database

---

**Most likely fix**: You just need to add `DATABASE_URL` to Vercel environment variables and redeploy! 🚀