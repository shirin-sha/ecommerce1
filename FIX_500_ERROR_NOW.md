# 🚨 Fix 500 Error - Action Checklist

Follow these steps **in order** to fix your 500 error:

## ⚡ Quick Actions (Do These First!)

### 1. Check Vercel Function Logs (2 minutes)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **API project**
3. Click **Deployments** tab
4. Click on the **latest deployment** (the one with the error)
5. Click **Functions** tab
6. Click on any function invocation
7. **Look for error messages** - copy them!

**What to look for:**
- ❌ "MongoDB connection failed"
- ❌ "Cannot find module"
- ❌ "MONGO_URI is undefined"
- ❌ Any red error messages

**Share what you see** - this will tell us exactly what's wrong!

---

### 2. Test Health Endpoint (30 seconds)

Open in browser or run:
```bash
curl https://your-api.vercel.app/health
```

**Expected:** `{"status":"ok","timestamp":"..."}`

**If this works:** ✅ Serverless function is working, issue is likely database or routes
**If this fails:** ❌ Serverless function itself has a problem

---

### 3. Verify Environment Variables (3 minutes)

In Vercel Dashboard → Your API Project → **Settings** → **Environment Variables**

**Check these exist (exact names, case-sensitive):**

```
✅ MONGO_URI
✅ JWT_SECRET  
✅ JWT_REFRESH_SECRET
✅ NODE_ENV
```

**Common mistakes:**
- ❌ `MONGODB_URI` (wrong - should be `MONGO_URI`)
- ❌ `mongo_uri` (wrong - must be uppercase)
- ❌ Variables set for "Development" only (must be "Production")

**Action:** If any are missing, add them and **REDEPLOY**!

---

### 4. Check MONGO_URI Format (2 minutes)

Your `MONGO_URI` should look like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
```

**Common issues:**
- ❌ Still has `<password>` placeholder
- ❌ Missing database name (before the `?`)
- ❌ Special characters in password not URL-encoded

**Fix special characters:**
- `@` → `%40`
- `#` → `%23`  
- `$` → `%24`
- `%` → `%25`

**Test locally first:**
1. Copy your `MONGO_URI` from Vercel
2. Add to local `.env` file in `apps/api/`
3. Run: `cd apps/api && pnpm dev`
4. If it connects locally, the URI is correct

---

### 5. Check MongoDB Atlas Network Access (1 minute)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Click **Network Access**
3. Check if `0.0.0.0/0` is in the list
4. If not, click **Add IP Address** → **Allow Access from Anywhere**
5. Wait 1-2 minutes for changes to apply

---

### 6. Redeploy After Changes (1 minute)

**IMPORTANT:** After adding/updating environment variables:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete
5. Test again

**Environment variables don't apply until you redeploy!**

---

## 🔍 Diagnostic Tests

### Test 1: Health Check
```bash
curl https://your-api.vercel.app/health
```
**Should return:** `{"status":"ok","timestamp":"..."}`

### Test 2: API Info
```bash
curl https://your-api.vercel.app/api/v1
```
**Should return:** `{"message":"E-Commerce API","version":"1.0.0"}`

### Test 3: Check Logs for Database Connection
In Vercel function logs, look for:
- ✅ "✅ MongoDB connected successfully" = Good!
- ❌ "MongoDB connection failed" = Database issue
- ❌ No database messages = Database not connecting

---

## 🎯 Most Likely Issues (90% of cases)

### Issue #1: Wrong MONGO_URI Format
**Fix:** Check connection string format, test locally first

### Issue #2: MongoDB Atlas Network Access
**Fix:** Add `0.0.0.0/0` to allowed IPs

### Issue #3: Environment Variables Not Set
**Fix:** Add all required variables, set for "Production", redeploy

### Issue #4: Not Redeploying After Adding Variables
**Fix:** Must redeploy after adding environment variables!

---

## ✅ Success Checklist

You'll know it's fixed when:

- [ ] `/health` endpoint returns `{"status":"ok"}`
- [ ] `/api/v1` endpoint returns API info
- [ ] Function logs show "✅ MongoDB connected successfully"
- [ ] No 500 errors in Vercel logs
- [ ] Can access API endpoints

---

## 🆘 Still Not Working?

If you've tried everything above:

1. **Share your Vercel function logs** (screenshot or copy the error)
2. **Share your environment variable NAMES** (not values - just the names)
3. **Test health endpoint** and share the response
4. **Check MongoDB Atlas** - is cluster status "Running" (not paused)?

The logs will tell us exactly what's wrong!

---

## 📝 Quick Reference

**Required Environment Variables:**
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your-32-char-secret
JWT_REFRESH_SECRET=your-32-char-secret  
NODE_ENV=production
```

**Test Commands:**
```bash
# Health check
curl https://your-api.vercel.app/health

# API info
curl https://your-api.vercel.app/api/v1
```

**After fixing, always:**
1. Redeploy in Vercel
2. Test health endpoint
3. Check function logs
