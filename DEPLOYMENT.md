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
DATABASE_URL=your_neon_pooled_connection_string
DATABASE_URL_UNPOOLED=your_neon_unpooled_connection_string
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

## Strapi CMS Setup

### What is Strapi Used For?
Strapi is used as a headless CMS for static content, navigation, and dynamic zones in the Historian App. It powers the public navigation, static pages, and dynamic content blocks rendered in Next.js.

### Running Strapi Locally
1. Ensure you have a Postgres database available for Strapi (can use Neon, Supabase, or Docker Postgres).
2. Set up environment variables for Strapi in your `.env.local` or `.env`:
   - `STRAPI_DB_HOST`, `STRAPI_DB_NAME`, `STRAPI_DB_USER`, `STRAPI_DB_PASSWORD`
   - `STRAPI_JWT_SECRET`, `STRAPI_ADMIN_JWT_SECRET`, `STRAPI_APP_KEYS`, `STRAPI_API_TOKEN_SALT`
3. Start Strapi:
   ```bash
   docker-compose up strapi
   # or for staging config:
   docker-compose -f docker-compose.staging.yml up strapi
   ```
4. Access Strapi admin at [http://localhost:1337/admin](http://localhost:1337/admin) (or port 1338 for staging).

### Running Strapi in Staging/Production
- Strapi is included as a service in `docker-compose.yml` (production) and `docker-compose.staging.yml` (staging).
- Make sure to set the `STRAPI_*` environment variables in your deployment platform (or in `.env.staging`, `.env.production`).
- For staging, Strapi runs on port 1338 (mapped to 1337 in the container).
- You can access the admin panel at `http://your-staging-domain:1338/admin`.

### Strapi Environment Variables
- `STRAPI_DB_HOST`, `STRAPI_DB_NAME`, `STRAPI_DB_USER`, `STRAPI_DB_PASSWORD`: Postgres connection for Strapi
- `STRAPI_JWT_SECRET`, `STRAPI_ADMIN_JWT_SECRET`, `STRAPI_APP_KEYS`, `STRAPI_API_TOKEN_SALT`: Strapi secrets (generate strong values for each environment)

### Content Migration
- Navigation and page content must be created in each environment (no automatic sync between local, staging, and production).
- You can use Strapi's export/import plugins or manual recreation for migration.

### Next.js Integration
- The Next.js app fetches navigation and page content from Strapi via REST API (see `client-layout.js` and `[...slug]/page.tsx`).
- Ensure the Strapi API is accessible from your Next.js app in each environment.
