# Troubleshooting 500 Error on Vercel API Deployment

## 🔍 Quick Diagnostic Steps

### Step 1: Check Vercel Function Logs

1. Go to your Vercel Dashboard
2. Select your API project
3. Click on **Deployments** tab
4. Click on the latest deployment
5. Click on **Functions** tab
6. Click on a function invocation to see logs

**Look for:**
- Database connection errors
- Missing environment variables
- Import/module errors
- TypeScript compilation errors

### Step 2: Test Health Endpoint

Try accessing:
```
https://your-api.vercel.app/health
```

**Expected:** `{"status":"ok","timestamp":"..."}`

**If this fails:** The issue is with the basic serverless function setup.

### Step 3: Check Environment Variables

In Vercel Dashboard → Settings → Environment Variables, verify:

**Required Variables:**
- ✅ `MONGO_URI` - MongoDB Atlas connection string
- ✅ `JWT_SECRET` - 32+ character secret
- ✅ `JWT_REFRESH_SECRET` - 32+ character secret
- ✅ `NODE_ENV` - Set to `production`

**Optional but Recommended:**
- `ADMIN_URL` - Your admin dashboard URL
- `STOREFRONT_URL` - Your storefront URL

### Step 4: Verify MongoDB Connection String

Your `MONGO_URI` should look like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
```

**Common Issues:**
- ❌ Missing password replacement (`<password>` not replaced)
- ❌ Missing database name
- ❌ Special characters in password not URL-encoded
- ❌ Wrong cluster URL

**Fix:**
- URL-encode special characters in password:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`
  - `&` → `%26`
  - `+` → `%2B`
  - `=` → `%3D`

### Step 5: Check MongoDB Atlas Network Access

1. Go to MongoDB Atlas Dashboard
2. Click **Network Access**
3. Ensure `0.0.0.0/0` is allowed (or add Vercel IPs)
4. Wait 1-2 minutes for changes to propagate

---

## 🐛 Common Issues & Solutions

### Issue 1: Database Connection Timeout

**Symptoms:**
- Logs show: "MongoDB connection failed"
- Timeout errors
- 500 errors on all endpoints

**Solutions:**

1. **Check Connection String:**
   ```bash
   # Test connection string locally first
   # In your local .env file, use the same MONGO_URI
   # Run: cd apps/api && pnpm dev
   # If it works locally, the connection string is correct
   ```

2. **Increase Timeout (if needed):**
   The code already has a 5s timeout. If your MongoDB Atlas is slow:
   - Check MongoDB Atlas cluster status
   - Consider upgrading from free tier
   - Check your region (should be close to Vercel region)

3. **Verify Database User:**
   - Go to MongoDB Atlas → Database Access
   - Ensure user has "Read and write to any database" permission
   - Check user is not expired/disabled

### Issue 2: Missing Environment Variables

**Symptoms:**
- Logs show `undefined` for environment variables
- Database connection fails with "Invalid connection string"

**Solutions:**

1. **Double-check variable names:**
   - Must be exactly: `MONGO_URI` (not `MONGODB_URI`)
   - Case-sensitive!

2. **Check Environment Scope:**
   - In Vercel, set variables for **Production** environment
   - Also set for **Preview** if you want preview deployments to work

3. **Redeploy after adding variables:**
   - Adding env vars doesn't automatically redeploy
   - Go to Deployments → Click ⋯ → Redeploy

### Issue 3: TypeScript Compilation Errors

**Symptoms:**
- Build fails
- Function not found errors
- Import errors in logs

**Solutions:**

1. **Check TypeScript Config:**
   - Verify `apps/api/tsconfig.json` includes `api/**/*`
   - Should have: `"include": ["src/**/*", "api/**/*"]`

2. **Verify Build:**
   ```bash
   # Test build locally
   cd apps/api
   pnpm build
   # Check for errors
   ```

3. **Check Dependencies:**
   - Ensure all imports are installed
   - Check `package.json` has all required dependencies

### Issue 4: CORS Errors (Not 500, but related)

**Symptoms:**
- Frontend can't connect to API
- CORS errors in browser console

**Solutions:**

1. **Set ADMIN_URL and STOREFRONT_URL:**
   ```
   ADMIN_URL=https://your-admin.vercel.app
   STOREFRONT_URL=https://your-storefront.vercel.app
   ```

2. **Redeploy API** after adding these variables

3. **Check CORS logs:**
   - Look for "CORS blocked origin" in function logs
   - Verify URLs match exactly (including https://)

### Issue 5: Module Not Found Errors

**Symptoms:**
- "Cannot find module" errors
- "@ecommerce/shared" not found

**Solutions:**

1. **Verify Install Command:**
   - In Vercel project settings
   - Install Command should be: `cd ../.. && pnpm install`
   - This installs from monorepo root

2. **Check pnpm-workspace.yaml:**
   - Should exist in root
   - Should include `packages: ['apps/*', 'packages/*']`

3. **Verify Shared Package:**
   - `packages/shared/package.json` should exist
   - Should have proper exports

### Issue 6: Function Timeout

**Symptoms:**
- Request times out after 10 seconds (Hobby plan)
- First request is slow

**Solutions:**

1. **Upgrade to Pro Plan:**
   - Pro plan has 60s timeout
   - Better for database connections

2. **Optimize Database:**
   - Add indexes to frequently queried fields
   - Optimize queries
   - Use connection pooling (already implemented)

3. **Keep Functions Warm:**
   - Use Vercel Cron to ping `/health` every 5 minutes
   - Prevents cold starts

---

## 🔧 Step-by-Step Debugging

### 1. Test Health Endpoint First

```bash
curl https://your-api.vercel.app/health
```

**If this works:** The serverless function is working, issue is likely with:
- Database connection
- Specific routes
- Environment variables for specific features

**If this fails:** The serverless function itself has issues:
- Check function logs
- Verify `api/index.ts` exists
- Check `vercel.json` configuration

### 2. Test API Info Endpoint

```bash
curl https://your-api.vercel.app/api/v1
```

**Expected:** `{"message":"E-Commerce API","version":"1.0.0"}`

**If this fails:** Check:
- Route configuration in `vercel.json`
- Express app setup
- Middleware issues

### 3. Test Database Connection

Try a simple endpoint that requires database:
```bash
curl https://your-api.vercel.app/api/v1/products
```

**Check logs for:**
- "MongoDB connected successfully" ✅
- "MongoDB connection failed" ❌
- Connection timeout errors

### 4. Check Specific Error in Logs

1. Go to Vercel Dashboard
2. Deployments → Latest → Functions
3. Click on a failed invocation
4. Look for:
   - Error stack traces
   - Console.log messages
   - Database connection messages

---

## 📝 Environment Variables Checklist

Copy this and check each one:

```
✅ MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority
✅ JWT_SECRET=your-32-character-secret-minimum
✅ JWT_REFRESH_SECRET=your-32-character-secret-minimum
✅ NODE_ENV=production
✅ ADMIN_URL=https://your-admin.vercel.app (optional but recommended)
✅ STOREFRONT_URL=https://your-storefront.vercel.app (optional but recommended)
```

**Important:**
- All variables must be set for **Production** environment
- Redeploy after adding/updating variables
- Check for typos (case-sensitive!)

---

## 🚀 Quick Fixes to Try

### Fix 1: Update Serverless Function Handler

The code has been updated with better error handling. Make sure you have the latest version of `apps/api/api/index.ts`.

### Fix 2: Add Debug Logging

Temporarily add logging to see what's happening:

```typescript
// In apps/api/api/index.ts, add at the top of the handler:
export default async (req: any, res: any) => {
  console.log('Request received:', req.method, req.url)
  console.log('MONGO_URI exists:', !!process.env.MONGO_URI)
  console.log('NODE_ENV:', process.env.NODE_ENV)
  
  try {
    await connectDB()
  } catch (error) {
    console.error('Database connection error:', error)
  }
  
  return app(req, res)
}
```

### Fix 3: Simplify CORS Temporarily

If CORS is causing issues, temporarily allow all origins:

```typescript
// In apps/api/api/index.ts
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true,
}))
```

**Remember to fix this after debugging!**

### Fix 4: Test Without Database

Temporarily comment out database connection to see if that's the issue:

```typescript
// Comment out database connection
// await connectDB()
```

If health check works without DB, the issue is definitely the database connection.

---

## 📞 Still Not Working?

If none of these solutions work:

1. **Share your Vercel function logs** (screenshot or copy)
2. **Share your environment variable names** (not values!)
3. **Test the health endpoint** and share the response
4. **Check MongoDB Atlas** - is the cluster running?
5. **Verify the connection string** works locally

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ `/health` returns: `{"status":"ok","timestamp":"..."}`
2. ✅ `/api/v1` returns: `{"message":"E-Commerce API","version":"1.0.0"}`
3. ✅ Function logs show: "✅ MongoDB connected successfully"
4. ✅ No errors in Vercel function logs
5. ✅ API endpoints respond (even if with errors, not 500)

---

## 🎯 Most Common Fix

**90% of 500 errors are caused by:**

1. **Wrong MONGO_URI format** - Check connection string
2. **MongoDB Atlas network access** - Must allow 0.0.0.0/0
3. **Environment variables not set** - Check Vercel dashboard
4. **Not redeploying after adding env vars** - Must redeploy!

**Try these first!**
