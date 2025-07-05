# Deployment Guide

## Quick Deploy to Vercel (Recommended)

### 1. Prepare Your Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your repository
5. Configure environment variables (see below)
6. Deploy!

### 3. Environment Variables (Required)
Add these in Vercel dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=your_postgresql_connection_string
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id
WORKOS_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
WORKOS_COOKIE_PASSWORD=your_workos_cookie_password
AUTHKIT_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
```

## WorkOS Setup

### 1. Create WorkOS Account
1. Go to [workos.com](https://workos.com)
2. Sign up for a free account
3. Create a new project

### 2. Configure AuthKit
1. In your WorkOS dashboard, go to "AuthKit"
2. Add your redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://your-domain.vercel.app/api/auth/callback`
3. Copy your API key and client ID

### 3. Environment Variables
Set these in your Vercel environment:
- `WORKOS_API_KEY`: Your WorkOS API key
- `WORKOS_CLIENT_ID`: Your WorkOS client ID
- `WORKOS_REDIRECT_URI`: Your production callback URL
- `WORKOS_COOKIE_PASSWORD`: A secure random string for cookie encryption
- `AUTHKIT_REDIRECT_URI`: Same as WORKOS_REDIRECT_URI

## Database Options

### Option 1: Neon (Recommended)
- Free tier: 1 database, 3GB storage, 10GB transfer/month
- PostgreSQL compatible
- Serverless architecture
- Built-in connection pooling
- Automatic scaling

### Option 2: Supabase
- Free tier: 500MB database, 2GB bandwidth
- PostgreSQL with real-time features
- Built-in auth and storage
- Easy setup

### Option 3: Railway
- Simple setup
- Good free tier
- PostgreSQL support
- Automatic deployments

### Option 4: AWS RDS
- More control
- Pay-as-you-go
- Requires more setup
- PostgreSQL support

## Production Checklist

- [ ] WorkOS account created and configured
- [ ] Environment variables configured in Vercel
- [ ] Database migrated and seeded
- [ ] WorkOS redirect URIs configured
- [ ] Domain configured (optional)
- [ ] SSL certificate (automatic with Vercel)
- [ ] Monitoring set up
- [ ] Backup strategy implemented

## Monitoring & Analytics

### Vercel Analytics
- Built-in performance monitoring
- Real user metrics
- Error tracking

### Additional Tools
- Sentry for error tracking
- Google Analytics for user behavior
- UptimeRobot for uptime monitoring

## Cost Estimation

### Vercel Pro ($20/month)
- Unlimited bandwidth
- 100GB storage
- Custom domains
- Team collaboration

### Database (Neon)
- Free tier: $0/month
- Pro: $19/month (if needed)

### WorkOS
- Free tier: $0/month (up to 1,000 MAU)
- Pro: $99/month (if needed)

**Total: ~$0-140/month depending on usage**

## Troubleshooting

### Common Issues
1. **Build fails**: Check environment variables
2. **Database connection**: Verify DATABASE_URL
3. **Authentication issues**: Verify WorkOS configuration
4. **Redirect URI errors**: Check AUTHKIT_REDIRECT_URI

### Support
- Vercel: [vercel.com/support](https://vercel.com/support)
- Neon: [neon.tech/docs](https://neon.tech/docs)
- WorkOS: [workos.com/docs](https://workos.com/docs)
