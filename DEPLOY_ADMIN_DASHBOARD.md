# 🚀 Deploy Admin Dashboard to Vercel

## Quick Deployment Guide

### Prerequisites
- ✅ API is deployed and working: `https://ecommerce1-api-nu.vercel.app`
- ✅ You have the API URL ready

---

## Step 1: Create New Vercel Project

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in if needed

2. **Import Your Repository**
   - Click **Import Project** or **Add New** → **Project**
   - Select your repository: `ecommerce1`
   - Click **Import**

3. **Configure Project Settings**
   - **Project Name:** `ecommerce-admin` (or your preferred name)
   - **Root Directory:** Click **Edit** → Set to `apps/admin`
   - **Framework Preset:** Select **Vite**
   - **Build Command:** `cd ../.. && pnpm --filter admin build`
   - **Output Directory:** `dist`
   - **Install Command:** `cd ../.. && pnpm install`
   - Click **Deploy**

4. **Wait for Initial Deployment**
   - Vercel will install dependencies and build
   - Takes 2-3 minutes
   - Note the deployment URL (e.g., `https://ecommerce-admin-xxx.vercel.app`)

### Option B: Via Vercel CLI

```bash
# Navigate to admin directory
cd apps/admin

# Login to Vercel (if not already)
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name: ecommerce-admin
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

---

## Step 2: Configure Environment Variables

### Add API URL

1. **Go to Vercel Dashboard**
   - Click on your **Admin project**
   - Go to **Settings** → **Environment Variables**

2. **Add Environment Variable**
   - Click **Add New**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://ecommerce1-api-nu.vercel.app` (your API URL)
   - **Environment:** Select **Production** (and **Preview** if you want)
   - Click **Save**

**Important:** 
- ✅ Variable name must be exactly: `VITE_API_URL` (Vite requires `VITE_` prefix)
- ✅ Value must include `https://` (not `http://`)
- ✅ No trailing slash at the end

---

## Step 3: Redeploy

**CRITICAL:** After adding environment variables, you must redeploy!

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

## Step 4: Verify Deployment

### Test Admin Dashboard

1. **Visit your admin URL:**
   ```
   https://your-admin-app.vercel.app
   ```

2. **Should see:**
   - Login page loads
   - No console errors
   - Can see the login form

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to **Console** tab
   - Should NOT see:
     - ❌ CORS errors
     - ❌ "Failed to fetch" errors
     - ❌ API connection errors

4. **Test Login (if database is seeded):**
   - Email: `admin@example.com`
   - Password: `admin123`

---

## ✅ Deployment Checklist

- [ ] Admin project created in Vercel
- [ ] Root Directory set to `apps/admin`
- [ ] Framework Preset: **Vite**
- [ ] Build Command: `cd ../.. && pnpm --filter admin build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `cd ../.. && pnpm install`
- [ ] Environment variable `VITE_API_URL` set to API URL
- [ ] Variable set for **Production** environment
- [ ] Redeployed after adding environment variable
- [ ] Admin dashboard loads in browser
- [ ] No console errors
- [ ] Login page appears

---

## 🔧 Troubleshooting

### Issue 1: Build Fails

**Symptoms:**
- Deployment fails during build
- Build logs show errors

**Solutions:**
1. ✅ Check build command: `cd ../.. && pnpm --filter admin build`
2. ✅ Verify install command: `cd ../.. && pnpm install`
3. ✅ Check shared package builds (should build automatically)
4. ✅ Verify TypeScript compilation succeeds

### Issue 2: Blank Page

**Symptoms:**
- Admin loads but shows blank page
- Console shows errors

**Solutions:**
1. ✅ Check `vercel.json` has rewrites configuration
2. ✅ Verify `outputDirectory` is `dist`
3. ✅ Check browser console for JavaScript errors
4. ✅ Verify environment variables are set

### Issue 3: API Connection Errors

**Symptoms:**
- Console shows "Failed to fetch"
- CORS errors
- API calls fail

**Solutions:**
1. ✅ Verify `VITE_API_URL` is set correctly
2. ✅ Check API URL includes `https://` (not `http://`)
3. ✅ Verify API is deployed and accessible
4. ✅ Check API CORS settings (should allow admin URL)
5. ✅ Redeploy admin after setting environment variable

### Issue 4: Shared Package Error

**Symptoms:**
- Build fails with "Cannot find module '@ecommerce/shared'"

**Solutions:**
1. ✅ Verify install command runs from root: `cd ../.. && pnpm install`
2. ✅ Check `pnpm-workspace.yaml` exists in root
3. ✅ Verify shared package builds (should happen automatically)
4. ✅ Check build logs for shared package build

### Issue 5: Routing Issues

**Symptoms:**
- Routes don't work (404 on refresh)
- Direct URL access fails

**Solutions:**
1. ✅ Verify `vercel.json` has rewrites:
   ```json
   "rewrites": [
     {
       "source": "/(.*)",
       "destination": "/index.html"
     }
   ]
   ```
2. ✅ Check `outputDirectory` is `dist`
3. ✅ Verify `index.html` exists in `dist` folder

---

## 📝 Environment Variables Reference

### Admin Project (`apps/admin`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API backend URL | `https://ecommerce1-api-nu.vercel.app` |

**Important Notes:**
- Must start with `VITE_` prefix (Vite requirement)
- Must include `https://` protocol
- No trailing slash
- Must redeploy after adding/updating

---

## 🔄 Update API CORS (After Admin Deployment)

After deploying admin, update API CORS settings:

1. **Go to API Project** in Vercel Dashboard
2. **Settings** → **Environment Variables**
3. **Add/Update:**
   ```
   ADMIN_URL=https://your-admin-app.vercel.app
   ```
4. **Redeploy API**

This allows the admin to make API requests.

---

## 🎯 Quick Reference

### Vercel Project Settings

**Root Directory:** `apps/admin`  
**Framework:** Vite  
**Build Command:** `cd ../.. && pnpm --filter admin build`  
**Output Directory:** `dist`  
**Install Command:** `cd ../.. && pnpm install`

### Environment Variables

```
VITE_API_URL=https://ecommerce1-api-nu.vercel.app
```

### Test URLs

- **Admin Dashboard:** `https://your-admin-app.vercel.app`
- **API Health:** `https://ecommerce1-api-nu.vercel.app/health`

---

## ✅ Success Indicators

You'll know it's working when:

- ✅ Admin dashboard loads in browser
- ✅ Login page appears
- ✅ No console errors
- ✅ No CORS errors
- ✅ Can make API calls (check Network tab)
- ✅ Routes work (can navigate between pages)

---

## 🚀 Next Steps

After admin is deployed:

1. ✅ **Update API CORS** - Add `ADMIN_URL` to API environment variables
2. ✅ **Test Login** - Try logging in with seeded credentials
3. ✅ **Test Features** - Navigate through admin pages
4. ✅ **Deploy Storefront** - Deploy the customer-facing storefront

---

**Ready to deploy? Follow Step 1 above!**
