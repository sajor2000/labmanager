# Database Setup Guide

## Overview
The LabSync Research Platform uses PostgreSQL as its database. This guide provides instructions for setting up the database locally and in production.

## Local Development Setup

### Option 1: Using Docker (Recommended)

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop

2. **Start PostgreSQL with Docker Compose**
   ```bash
   # Start the database
   docker compose up -d
   
   # Check if it's running
   docker compose ps
   ```

3. **Database Connection**
   The database will be available at:
   - Host: `localhost`
   - Port: `5432`
   - Database: `labmanage_dev`
   - Username: `postgres`
   - Password: `password`

### Option 2: Using PostgreSQL App (macOS)

1. **Install Postgres.app**
   - Download from: https://postgresapp.com/
   - Open the app and click "Initialize"

2. **Create Database**
   ```bash
   createdb labmanage_dev
   ```

3. **Update .env file**
   ```env
   DATABASE_URL="postgresql://localhost/labmanage_dev"
   ```

### Option 3: Using Homebrew (macOS)

1. **Install PostgreSQL**
   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. **Create Database**
   ```bash
   createdb labmanage_dev
   ```

## Database Setup After Installation

Once PostgreSQL is running, run these commands:

```bash
# Push the database schema
npm run db:push

# Seed the database with initial data
npm run db:seed

# Open Prisma Studio to view data
npm run db:studio
```

## Production Setup (Vercel + Prisma Accelerate)

### 1. Create Vercel Postgres Database
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Create database
vercel postgres create
```

### 2. Get Database URLs
```bash
# Pull environment variables
vercel env pull .env.production.local
```

### 3. Set Up Prisma Accelerate

1. Go to: https://console.prisma.io/
2. Create a new project
3. Connect your database
4. Get the Accelerate connection string (starts with `prisma://`)

### 4. Update Vercel Environment Variables

Add these to your Vercel project settings:
- `DATABASE_URL`: Your Prisma Accelerate URL
- `DATABASE_URL_UNPOOLED`: Direct database connection URL

### 5. Deploy
```bash
vercel --prod
```

## Using Supabase (Alternative)

If you prefer Supabase:

1. **Create Supabase Project**
   - Go to: https://app.supabase.com/
   - Create a new project

2. **Get Connection String**
   - Go to Settings → Database
   - Copy the connection string

3. **Update .env**
   ```env
   DATABASE_URL="your-supabase-connection-string"
   ```

4. **Run Setup**
   ```bash
   npm run db:push
   npm run db:seed
   ```

## Troubleshooting

### Connection Refused Error
- Make sure PostgreSQL is running
- Check if port 5432 is not in use: `lsof -i :5432`
- For Docker: `docker compose logs postgres`

### Permission Denied
- Check your database credentials in `.env`
- Ensure the database exists: `psql -l`

### Schema Not Updating
```bash
# Reset database and re-push schema
npm run db:push -- --force-reset
```

## Useful Commands

```bash
# View database logs (Docker)
docker compose logs -f postgres

# Connect to database
psql postgresql://postgres:password@localhost:5432/labmanage_dev

# Reset database
npm run db:push -- --force-reset

# Generate Prisma Client
npm run db:generate

# Create migration
npm run db:migrate
```

## Next Steps

After setting up the database:

1. The application will automatically connect to your database
2. All mock data has been removed
3. Real data will be fetched from the database
4. Drag-and-drop operations will persist
5. All CRUD operations work with the database

Visit http://localhost:3000 to see your application with real data!