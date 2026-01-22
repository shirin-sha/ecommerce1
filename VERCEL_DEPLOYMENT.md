# Vercel Deployment Guide

This guide explains how to deploy the E-Commerce API and Admin Dashboard to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a MongoDB Atlas cluster (free tier available)
3. **Vercel CLI** (optional): `npm i -g vercel`

---

## 🚀 Deployment Steps

### Step 1: Deploy API Backend

1. **Navigate to API directory:**
   ```bash
   cd apps/api
   ```

2. **Deploy via Vercel CLI:**
   ```bash
   vercel
   ```
   
   Or connect via GitHub:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Set **Root Directory** to `apps/api`
   - Framework Preset: **Other**
   - Build Command: Leave empty (Vercel auto-detects)
   - Output Directory: Leave empty
   - Install Command: `cd ../.. && pnpm install`

3. **Configure Environment Variables** in Vercel Dashboard:
   ```
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key_min_32_chars
   JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
   NODE_ENV=production
   ADMIN_URL=https://your-admin-app.vercel.app
   ```

4. **Note the API URL** after deployment (e.g., `https://your-api.vercel.app`)

---

### Step 2: Deploy Admin Dashboard

1. **Navigate to Admin directory:**
   ```bash
   cd apps/admin
   ```

2. **Deploy via Vercel CLI:**
   ```bash
   vercel
   ```
   
   Or connect via GitHub:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Set **Root Directory** to `apps/admin`
   - Framework Preset: **Vite**
   - Build Command: `cd ../.. && pnpm --filter admin build`
   - Output Directory: `dist`
   - Install Command: `cd ../.. && pnpm install`

3. **Configure Environment Variables:**
   ```
   VITE_API_URL=https://your-api.vercel.app
   ```
   (Replace with your actual API URL from Step 1)

---

## 🔧 Configuration Details

### API Serverless Function

The API is configured as a Vercel serverless function in `apps/api/api/index.ts`. This wraps the Express app for serverless execution.

**Key Features:**
- Database connection is cached across invocations
- CORS is configured to allow Admin frontend
- All routes are prefixed with `/api/v1`

### Admin Frontend

The Admin dashboard is a static React app built with Vite.

**Key Features:**
- Uses `VITE_API_URL` environment variable for API calls
- All routes are handled client-side (SPA)
- Rewrites all routes to `index.html` for React Router

---

## 🌍 Environment Variables Reference

### API Project (`apps/api`)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret for access tokens | `your-secret-key-min-32-chars` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `your-refresh-secret-min-32-chars` |
| `NODE_ENV` | Environment | `production` |
| `ADMIN_URL` | Admin frontend URL | `https://your-admin.vercel.app` |

### Admin Project (`apps/admin`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API backend URL | `https://your-api.vercel.app` |

---

## 🔍 Troubleshooting

### API Issues

**Problem: Database connection fails**
- Check `MONGO_URI` is correct
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0` (or Vercel IPs)
- Check MongoDB Atlas cluster is running

**Problem: CORS errors**
- Verify `ADMIN_URL` matches your admin deployment URL
- Check API environment variables are set correctly

**Problem: Cold start timeouts**
- Vercel serverless functions have a 10s timeout on Hobby plan
- Consider upgrading to Pro plan for longer timeouts
- Optimize database queries (add indexes)

### Admin Issues

**Problem: API calls fail**
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure API is deployed and accessible

**Problem: Build fails**
- Ensure `pnpm` is installed in Vercel
- Check that shared package builds correctly
- Verify all dependencies are in `package.json`

---

## 📝 Post-Deployment Checklist

- [ ] API health check works: `https://your-api.vercel.app/health`
- [ ] Admin dashboard loads: `https://your-admin.vercel.app`
- [ ] Login works in admin dashboard
- [ ] API endpoints respond correctly
- [ ] CORS is configured properly
- [ ] Environment variables are set
- [ ] MongoDB connection is working
- [ ] Database indexes are created (run seed script locally if needed)

---

## 🔄 Updating Deployments

### Via CLI:
```bash
# API
cd apps/api
vercel --prod

# Admin
cd apps/admin
vercel --prod
```

### Via GitHub:
- Push changes to your main branch
- Vercel will automatically redeploy

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)

---

## ⚠️ Important Notes

1. **MongoDB Atlas**: Use MongoDB Atlas for production (not local MongoDB)
2. **File Uploads**: Local file storage won't work on Vercel. Use:
   - Vercel Blob Storage
   - Cloudinary
   - AWS S3
3. **Serverless Limits**: 
   - Hobby plan: 10s function timeout
   - Pro plan: 60s function timeout
4. **Database Connection**: Connection is cached, but first request may be slower
5. **Environment Variables**: Must be set in Vercel Dashboard for each project

---

## 🎯 Next Steps

After deployment:
1. Test all admin features
2. Set up custom domains (optional)
3. Configure monitoring/alerts
4. Set up CI/CD for automatic deployments
