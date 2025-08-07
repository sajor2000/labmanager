# 🚀 Quick Deployment Checklist

## Pre-Deployment Checklist
- [ ] All changes committed to Git
- [ ] Tests passing locally (`npm run test:e2e`)
- [ ] Build successful locally (`npm run build`)
- [ ] Environment variables documented
- [ ] Sensitive data removed from tracked files

## Vercel Deployment Steps

### 1️⃣ First-Time Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Link to Vercel
vercel link

# Pull environment variables (optional)
vercel env pull .env.development.local
```

### 2️⃣ Environment Variables to Add in Vercel Dashboard

Go to: [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables

Add these variables:

```
DATABASE_URL = [Your Postgres Direct URL]
PRISMA_DATABASE_URL = [Your Prisma Accelerate URL]
OPENAI_API_KEY = [Your OpenAI API Key]
RESEND_API_KEY = [Your Resend API Key]
EMAIL_FROM = [Your email address]
NEXTAUTH_SECRET = [Generate with: openssl rand -base64 32]
NEXTAUTH_URL = https://your-app.vercel.app
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
```

### 3️⃣ Deploy Commands

```bash
# First deployment (preview)
vercel

# Deploy to production
vercel --prod

# Or use Git integration (automatic deploys on push)
git push origin main
```

### 4️⃣ Post-Deployment Verification

- [ ] Visit production URL
- [ ] Test authentication flow
- [ ] Verify database connection
- [ ] Check avatar uploads work
- [ ] Test AI features (standups)
- [ ] Verify email sending
- [ ] Check dark/light theme toggle
- [ ] Test responsive design on mobile

## Rollback if Needed

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback

# Or rollback to specific deployment
vercel rollback [deployment-url]
```

## Monitor Performance

1. **Vercel Analytics**: Enable in dashboard
2. **Function Logs**: `vercel logs`
3. **Database**: Monitor in Prisma Data Platform
4. **Errors**: Check Vercel Functions tab

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Build fails | Check `vercel logs`, run `npm run build` locally |
| Database connection error | Verify DATABASE_URL in Vercel env vars |
| 500 errors | Check function logs: `vercel logs` |
| Slow performance | Enable Prisma Accelerate, check function regions |
| Authentication not working | Verify NEXTAUTH_URL matches production URL |

## Production URLs

After deployment, update these:
- GitHub repository settings → Add production URL
- Update README.md with live demo link
- Share with team: `https://labmanager.vercel.app`

---

✅ **Ready to Deploy!** Run `vercel --prod` when ready.