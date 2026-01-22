# Complete Vercel Deployment Guide

This comprehensive guide will walk you through deploying your entire e-commerce platform (API, Admin Dashboard, and Storefront) to Vercel.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Setup](#pre-deployment-setup)
3. [Deploy API Backend](#step-1-deploy-api-backend)
4. [Deploy Admin Dashboard](#step-2-deploy-admin-dashboard)
5. [Deploy Storefront](#step-3-deploy-storefront)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

1. ✅ **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier available)
2. ✅ **MongoDB Atlas Account** - Set up at [mongodb.com/atlas](https://www.mongodb.com/atlas) (free tier available)
3. ✅ **GitHub Account** - Your code should be in a GitHub repository
4. ✅ **Node.js & pnpm** - Installed locally for testing (Node >= 18.0.0, pnpm >= 8.0.0)
5. ✅ **Vercel CLI** (optional) - Install with `npm i -g vercel`

---

## Pre-Deployment Setup

### 1. Set Up MongoDB Atlas

1. **Create a MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Choose the free tier (M0)
   - Select a cloud provider and region closest to you
   - Wait for cluster creation (2-3 minutes)

3. **Configure Database Access**
   - Go to **Database Access** → **Add New Database User**
   - Create a username and password (save these!)
   - Set privileges to **Read and write to any database**

4. **Configure Network Access**
   - Go to **Network Access** → **Add IP Address**
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`)
   - This allows Vercel to connect to your database

5. **Get Connection String**
   - Go to **Database** → **Connect** → **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name (e.g., `ecommerce`)
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority`

### 2. Prepare Your Repository

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3. Generate JWT Secrets

Generate secure random strings for JWT secrets (minimum 32 characters):

```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use an online generator: https://randomkeygen.com/
```

Save these for later:
- `JWT_SECRET` - For access tokens
- `JWT_REFRESH_SECRET` - For refresh tokens

---

## Step 1: Deploy API Backend

### Option A: Deploy via Vercel Dashboard (Recommended for First Time)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click **Import Project**
   - Select your repository from the list
   - Click **Import**

3. **Configure Project Settings**
   - **Project Name**: `ecommerce-api` (or your preferred name)
   - **Root Directory**: Click **Edit** → Set to `apps/api`
   - **Framework Preset**: Select **Other**
   - **Build Command**: Leave empty (Vercel will auto-detect)
   - **Output Directory**: Leave empty
   - **Install Command**: `cd ../.. && pnpm install`
   - Click **Deploy**

4. **Wait for Initial Deployment**
   - Vercel will install dependencies and build
   - The first deployment may take 2-3 minutes
   - Note the deployment URL (e.g., `https://ecommerce-api-xxx.vercel.app`)

5. **Configure Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Add the following variables:

   ```
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority
   JWT_SECRET=your-generated-jwt-secret-min-32-chars
   JWT_REFRESH_SECRET=your-generated-refresh-secret-min-32-chars
   NODE_ENV=production
   ADMIN_URL=https://your-admin-app.vercel.app
   STOREFRONT_URL=https://your-storefront-app.vercel.app
   ```

   **Important Notes:**
   - Replace `MONGO_URI` with your actual MongoDB Atlas connection string
   - Replace `JWT_SECRET` and `JWT_REFRESH_SECRET` with your generated secrets
   - For `ADMIN_URL` and `STOREFRONT_URL`, you'll update these after deploying those apps
   - Set environment to **Production** (and optionally **Preview** and **Development**)

6. **Redeploy**
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Select **Redeploy**
   - This applies the new environment variables

### Option B: Deploy via Vercel CLI

```bash
# Navigate to API directory
cd apps/api

# Login to Vercel (first time only)
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name: ecommerce-api
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

Then add environment variables via dashboard (Settings → Environment Variables).

---

## Step 2: Deploy Admin Dashboard

### Option A: Deploy via Vercel Dashboard

1. **Create New Project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click **Add New** → **Project**
   - Import the same repository

2. **Configure Project Settings**
   - **Project Name**: `ecommerce-admin` (or your preferred name)
   - **Root Directory**: Click **Edit** → Set to `apps/admin`
   - **Framework Preset**: Select **Vite**
   - **Build Command**: `cd ../.. && pnpm --filter admin build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && pnpm install`
   - Click **Deploy**

3. **Configure Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Add:

   ```
   VITE_API_URL=https://your-api-app.vercel.app
   ```

   **Important:** Replace `your-api-app.vercel.app` with your actual API deployment URL from Step 1.

4. **Redeploy** to apply environment variables

### Option B: Deploy via Vercel CLI

```bash
# Navigate to Admin directory
cd apps/admin

# Deploy
vercel

# Follow prompts (similar to API)
# Project name: ecommerce-admin

# Deploy to production
vercel --prod
```

Add `VITE_API_URL` environment variable via dashboard.

---

## Step 3: Deploy Storefront

### Option A: Deploy via Vercel Dashboard

1. **Create New Project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click **Add New** → **Project**
   - Import the same repository

2. **Configure Project Settings**
   - **Project Name**: `ecommerce-storefront` (or your preferred name)
   - **Root Directory**: Click **Edit** → Set to `apps/storefront`
   - **Framework Preset**: Select **Vite**
   - **Build Command**: `cd ../.. && pnpm --filter storefront build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && pnpm install`
   - Click **Deploy**

3. **Create vercel.json for Storefront** (if not exists)
   - Create `apps/storefront/vercel.json`:

   ```json
   {
     "buildCommand": "cd ../.. && pnpm --filter storefront build",
     "outputDirectory": "dist",
     "devCommand": "cd ../.. && pnpm --filter storefront dev",
     "installCommand": "cd ../.. && pnpm install",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

4. **Configure Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Add:

   ```
   VITE_API_URL=https://your-api-app.vercel.app
   ```

   Replace with your actual API URL.

5. **Redeploy** to apply environment variables

### Option B: Deploy via Vercel CLI

```bash
# Navigate to Storefront directory
cd apps/storefront

# Deploy
vercel

# Follow prompts
# Project name: ecommerce-storefront

# Deploy to production
vercel --prod
```

Add `VITE_API_URL` environment variable via dashboard.

---

## Post-Deployment Configuration

### 1. Update API CORS Settings

After deploying Admin and Storefront, update the API environment variables:

1. Go to your **API project** in Vercel Dashboard
2. **Settings** → **Environment Variables**
3. Update:
   ```
   ADMIN_URL=https://your-actual-admin-url.vercel.app
   STOREFRONT_URL=https://your-actual-storefront-url.vercel.app
   ```
4. **Redeploy** the API

### 2. Seed the Database (Optional)

If you need to populate the database with initial data:

**Option A: Run seed script locally**
```bash
# Set MONGO_URI to your Atlas connection string
export MONGO_URI="mongodb+srv://..."
cd apps/api
pnpm seed
```

**Option B: Create a Vercel serverless function for seeding**
- Create `apps/api/api/seed.ts` (one-time use)
- Deploy and call it via HTTP
- Delete after seeding

### 3. Verify Database Connection

Check API logs in Vercel Dashboard:
- Go to **Deployments** → Click on a deployment → **Functions** tab
- Check for "✅ MongoDB connected successfully" message

---

## Verification & Testing

### 1. Test API Health Check

Visit your API URL:
```
https://your-api-app.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test API Endpoints

```bash
# Test API info
curl https://your-api-app.vercel.app/api/v1

# Should return:
# {"message":"E-Commerce API","version":"1.0.0"}
```

### 3. Test Admin Dashboard

1. Visit: `https://your-admin-app.vercel.app`
2. Should load the login page
3. If you seeded the database, login with:
   - Email: `admin@example.com`
   - Password: `admin123`

### 4. Test Storefront

1. Visit: `https://your-storefront-app.vercel.app`
2. Should load the storefront homepage
3. Products should load from the API

### 5. Test CORS

Open browser console on Admin/Storefront:
- Should not see CORS errors
- API requests should succeed

---

## Troubleshooting

### API Issues

#### Problem: Database Connection Fails

**Symptoms:**
- API returns 500 errors
- Logs show "MongoDB connection failed"

**Solutions:**
1. ✅ Verify `MONGO_URI` is correct in environment variables
2. ✅ Check MongoDB Atlas Network Access allows `0.0.0.0/0`
3. ✅ Verify database user credentials are correct
4. ✅ Check MongoDB Atlas cluster is running (not paused)
5. ✅ Ensure connection string includes database name: `...mongodb.net/ecommerce?...`

#### Problem: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API requests fail with CORS policy errors

**Solutions:**
1. ✅ Verify `ADMIN_URL` and `STOREFRONT_URL` are set correctly in API env vars
2. ✅ Ensure URLs match exactly (including `https://`)
3. ✅ Redeploy API after updating environment variables
4. ✅ Check API logs for CORS configuration

#### Problem: Cold Start Timeouts

**Symptoms:**
- First request after inactivity times out
- Takes 10+ seconds to respond

**Solutions:**
1. ⚠️ Vercel Hobby plan has 10s timeout limit
2. ✅ Upgrade to Pro plan for 60s timeout
3. ✅ Optimize database queries (add indexes)
4. ✅ Use MongoDB connection caching (already implemented)
5. ✅ Consider using Vercel Cron to keep functions warm

#### Problem: Function Not Found (404)

**Symptoms:**
- API routes return 404
- `/api/v1/*` routes don't work

**Solutions:**
1. ✅ Verify `apps/api/api/index.ts` exists
2. ✅ Check `apps/api/vercel.json` routes configuration
3. ✅ Ensure `@vercel/node` is installed (should be auto-detected)
4. ✅ Check deployment logs for build errors

### Admin Dashboard Issues

#### Problem: API Calls Fail

**Symptoms:**
- Admin dashboard loads but shows errors
- Network tab shows failed API requests

**Solutions:**
1. ✅ Verify `VITE_API_URL` is set correctly
2. ✅ Ensure API URL includes `https://` (not `http://`)
3. ✅ Check API is deployed and accessible
4. ✅ Verify CORS is configured on API
5. ✅ Check browser console for specific error messages

#### Problem: Build Fails

**Symptoms:**
- Deployment fails during build step
- Build logs show errors

**Solutions:**
1. ✅ Verify `pnpm` is available (Vercel auto-detects)
2. ✅ Check shared package builds correctly
3. ✅ Ensure all dependencies are in `package.json`
4. ✅ Check build command: `cd ../.. && pnpm --filter admin build`
5. ✅ Verify TypeScript compilation succeeds locally first

#### Problem: Blank Page / Routing Issues

**Symptoms:**
- Dashboard loads but shows blank page
- Routes don't work (404 on refresh)

**Solutions:**
1. ✅ Verify `vercel.json` has rewrites configuration
2. ✅ Check `outputDirectory` is set to `dist`
3. ✅ Ensure `index.html` exists in `dist` folder
4. ✅ Check browser console for JavaScript errors

### Storefront Issues

#### Problem: Similar to Admin Issues

Apply the same troubleshooting steps as Admin Dashboard:
- API connection issues → Check `VITE_API_URL`
- Build failures → Check build command and dependencies
- Routing issues → Verify `vercel.json` rewrites

### General Issues

#### Problem: Environment Variables Not Working

**Symptoms:**
- Variables set but not accessible in code

**Solutions:**
1. ✅ For Vite apps, variables must start with `VITE_`
2. ✅ Redeploy after adding/updating environment variables
3. ✅ Check variable names match exactly (case-sensitive)
4. ✅ Verify environment scope (Production/Preview/Development)

#### Problem: Shared Package Issues

**Symptoms:**
- Build fails with "Cannot find module @ecommerce/shared"

**Solutions:**
1. ✅ Ensure `pnpm-workspace.yaml` is in root
2. ✅ Verify `packages/shared` exists and has `package.json`
3. ✅ Check install command runs from root: `cd ../.. && pnpm install`
4. ✅ Verify workspace protocol in dependencies: `"@ecommerce/shared": "workspace:*"`

---

## Deployment Checklist

Use this checklist to ensure everything is set up correctly:

### Pre-Deployment
- [ ] MongoDB Atlas cluster created and running
- [ ] Database user created with read/write permissions
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied and tested
- [ ] JWT secrets generated (32+ characters each)
- [ ] Code pushed to GitHub

### API Deployment
- [ ] API project created in Vercel
- [ ] Root directory set to `apps/api`
- [ ] Environment variables configured:
  - [ ] `MONGO_URI`
  - [ ] `JWT_SECRET`
  - [ ] `JWT_REFRESH_SECRET`
  - [ ] `NODE_ENV=production`
  - [ ] `ADMIN_URL` (update after admin deployment)
  - [ ] `STOREFRONT_URL` (update after storefront deployment)
- [ ] API deployed successfully
- [ ] Health check works: `/health`
- [ ] API info endpoint works: `/api/v1`

### Admin Dashboard Deployment
- [ ] Admin project created in Vercel
- [ ] Root directory set to `apps/admin`
- [ ] Build command: `cd ../.. && pnpm --filter admin build`
- [ ] Output directory: `dist`
- [ ] Environment variable `VITE_API_URL` set to API URL
- [ ] Admin deployed successfully
- [ ] Admin loads in browser
- [ ] Login page appears

### Storefront Deployment
- [ ] Storefront project created in Vercel
- [ ] Root directory set to `apps/storefront`
- [ ] Build command: `cd ../.. && pnpm --filter storefront build`
- [ ] Output directory: `dist`
- [ ] `vercel.json` created with rewrites
- [ ] Environment variable `VITE_API_URL` set to API URL
- [ ] Storefront deployed successfully
- [ ] Storefront loads in browser

### Post-Deployment
- [ ] API environment variables updated with actual Admin/Storefront URLs
- [ ] API redeployed with updated CORS settings
- [ ] Database seeded (if needed)
- [ ] All three apps tested and working
- [ ] No CORS errors in browser console
- [ ] Login works in admin dashboard
- [ ] Products load in storefront

---

## Updating Deployments

### Automatic Deployments (Recommended)

Connect your GitHub repository to Vercel:
- Every push to `main` branch automatically deploys
- Pull requests create preview deployments
- No manual steps needed

### Manual Deployments

**Via CLI:**
```bash
# API
cd apps/api
vercel --prod

# Admin
cd apps/admin
vercel --prod

# Storefront
cd apps/storefront
vercel --prod
```

**Via Dashboard:**
- Go to project → **Deployments**
- Click **Redeploy** on latest deployment

---

## Custom Domains (Optional)

To use custom domains:

1. Go to project **Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

---

## Monitoring & Analytics

### Vercel Analytics

1. Go to project → **Analytics** tab
2. Enable Vercel Analytics (Pro plan required)
3. Monitor performance, errors, and usage

### Function Logs

1. Go to **Deployments** → Click a deployment
2. Click **Functions** tab
3. View real-time logs and errors

### Database Monitoring

- Use MongoDB Atlas dashboard for:
  - Connection metrics
  - Query performance
  - Storage usage
  - Index recommendations

---

## Cost Considerations

### Vercel Pricing

- **Hobby Plan (Free)**:
  - 100GB bandwidth/month
  - 100 serverless function executions/day
  - 10s function timeout
  - Unlimited projects

- **Pro Plan ($20/month)**:
  - 1TB bandwidth/month
  - Unlimited function executions
  - 60s function timeout
  - Advanced analytics

### MongoDB Atlas Pricing

- **Free Tier (M0)**:
  - 512MB storage
  - Shared CPU/RAM
  - Good for development/testing

- **Shared (M2/M5)**:
  - Starts at $9/month
  - More storage and performance
  - Recommended for production

---

## Security Best Practices

1. ✅ **Never commit secrets** to Git
2. ✅ **Use strong JWT secrets** (32+ random characters)
3. ✅ **Enable MongoDB Atlas IP whitelisting** (or use VPC peering)
4. ✅ **Use HTTPS only** (Vercel provides automatically)
5. ✅ **Set `NODE_ENV=production`** in production
6. ✅ **Regularly rotate JWT secrets**
7. ✅ **Monitor API logs** for suspicious activity
8. ✅ **Use environment-specific variables** (Production vs Preview)

---

## Next Steps

After successful deployment:

1. ✅ **Set up monitoring** - Configure alerts for errors
2. ✅ **Set up backups** - MongoDB Atlas provides automatic backups
3. ✅ **Configure custom domains** - Use your own domain
4. ✅ **Set up CI/CD** - Automatic deployments from GitHub
5. ✅ **Performance optimization** - Add database indexes, optimize queries
6. ✅ **Scale as needed** - Upgrade plans when traffic grows

---

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Vercel Community**: https://github.com/vercel/vercel/discussions
- **Project Issues**: Check your repository's issues tab

---

**🎉 Congratulations!** Your e-commerce platform is now live on Vercel!

If you encounter any issues not covered in this guide, check the troubleshooting section or refer to the official documentation.
