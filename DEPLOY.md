# Quick Deployment Guide

## 🚀 Deploy to Vercel

### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy API:**
   ```bash
   cd apps/api
   vercel
   ```
   - Follow prompts to link/create project
   - When asked for environment variables, you can skip and add them in dashboard later

3. **Deploy Admin:**
   ```bash
   cd ../admin
   vercel
   ```

### Option 2: Using GitHub Integration

1. **Push your code to GitHub**

2. **Deploy API:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - **Root Directory**: `apps/api`
   - **Framework**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: `cd ../.. && pnpm install`

3. **Deploy Admin:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - **Root Directory**: `apps/admin`
   - **Framework**: Vite
   - **Build Command**: `cd ../.. && pnpm --filter admin build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && pnpm install`

## 🔐 Environment Variables

### API Project (`apps/api`)

Add these in Vercel Dashboard → Settings → Environment Variables:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
NODE_ENV=production
ADMIN_URL=https://your-admin-app.vercel.app
```

### Admin Project (`apps/admin`)

Add this environment variable:

```
VITE_API_URL=https://your-api-app.vercel.app
```

**Important:** Replace `your-api-app.vercel.app` with your actual API deployment URL.

## ✅ Verify Deployment

1. **Check API Health:**
   ```
   https://your-api.vercel.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check Admin Dashboard:**
   ```
   https://your-admin.vercel.app
   ```
   Should load the login page

3. **Test Login:**
   - Use credentials from seed script
   - Default: `admin@example.com` / `admin123`

## 📝 Notes

- MongoDB Atlas: Make sure your cluster allows connections from anywhere (`0.0.0.0/0`) or add Vercel IPs
- First API request may be slow (cold start)
- File uploads won't work with local storage - use Vercel Blob or Cloudinary

For detailed instructions, see `VERCEL_DEPLOYMENT.md`
