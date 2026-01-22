# 🔍 How to Check if Environment Variables are Loaded

## Quick Test

After deploying, test these endpoints:

### 1. Test Debug Endpoint
```bash
curl https://your-api.vercel.app/debug/env
```

**Expected Response:**
```json
{
  "hasMONGO_URI": true,
  "hasJWT_SECRET": true,
  "hasJWT_REFRESH_SECRET": true,
  "NODE_ENV": "production",
  "hasADMIN_URL": false,
  "hasSTOREFRONT_URL": false,
  "MONGO_URI_preview": "mongodb+srv://user:pa...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**If you see `"hasMONGO_URI": false`** → Environment variables are NOT being loaded!

---

## ✅ How to Fix Environment Variables in Vercel

### Step 1: Verify Variables are Set

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **API project**
3. Go to **Settings** → **Environment Variables**
4. Check these exist:

```
✅ MONGO_URI
✅ JWT_SECRET
✅ JWT_REFRESH_SECRET
✅ NODE_ENV
```

### Step 2: Check Environment Scope

**IMPORTANT:** Variables must be set for the correct environment:

- **Production** - For production deployments
- **Preview** - For preview deployments (optional)
- **Development** - For local development (optional)

**Action:** Make sure all variables are set for **Production**!

### Step 3: Verify Variable Names

**Common Mistakes:**
- ❌ `MONGODB_URI` (wrong - should be `MONGO_URI`)
- ❌ `mongo_uri` (wrong - case-sensitive, must be uppercase)
- ❌ `MONGO_URI ` (wrong - has trailing space)

**Correct:** `MONGO_URI` (exact match, no spaces)

### Step 4: Check Variable Values

**MONGO_URI Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
```

**Common Issues:**
- ❌ Still has `<password>` placeholder
- ❌ Missing database name
- ❌ Special characters not URL-encoded

**Fix Special Characters:**
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

### Step 5: REDEPLOY After Adding Variables

**CRITICAL:** After adding/updating environment variables:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete
5. Test again: `curl https://your-api.vercel.app/debug/env`

**Environment variables don't apply until you redeploy!**

---

## 🔍 Check Function Logs

After deploying, check the logs:

1. Go to **Deployments** → Latest deployment
2. Click **Functions** tab
3. Make a request to your API
4. Click on the function invocation
5. Look for these log messages:

**Good Signs:**
```
✅ MongoDB connected successfully
MONGO_URI is set: true
```

**Bad Signs:**
```
⚠️ MONGO_URI environment variable is not set!
MONGO_URI is set: false
Using fallback: mongodb://localhost:27017/ecommerce
```

---

## 🐛 Common Issues

### Issue 1: Variables Set but Not Loading

**Symptoms:**
- Variables are in Vercel dashboard
- But `debug/env` shows `false`

**Solutions:**
1. ✅ Check environment scope (must be "Production")
2. ✅ Redeploy after adding variables
3. ✅ Check for typos in variable names
4. ✅ Verify no trailing spaces

### Issue 2: Wrong Variable Name

**Symptoms:**
- Code expects `MONGO_URI`
- But you set `MONGODB_URI`

**Solution:**
- Rename variable to match exactly: `MONGO_URI`

### Issue 3: Variables in Wrong Project

**Symptoms:**
- Variables are set in a different Vercel project
- Or set for wrong environment

**Solution:**
- Make sure you're in the correct project
- Set variables for "Production" environment

### Issue 4: Build vs Runtime

**Symptoms:**
- Variables work in build
- But not at runtime

**Solution:**
- Vercel provides env vars at runtime automatically
- No special configuration needed
- Just make sure they're set in dashboard

---

## ✅ Verification Checklist

Use this checklist:

- [ ] All required variables are in Vercel Dashboard
- [ ] Variables are set for **Production** environment
- [ ] Variable names match exactly (case-sensitive)
- [ ] No trailing spaces in variable names
- [ ] MONGO_URI format is correct
- [ ] Redeployed after adding/updating variables
- [ ] `/debug/env` endpoint shows `hasMONGO_URI: true`
- [ ] Function logs show "MONGO_URI is set: true"

---

## 🚀 Quick Fix Steps

1. **Check variables in Vercel Dashboard**
   - Settings → Environment Variables
   - Verify all required variables exist

2. **Test debug endpoint**
   ```bash
   curl https://your-api.vercel.app/debug/env
   ```

3. **If variables are missing:**
   - Add them in Vercel Dashboard
   - Set for "Production" environment
   - **Redeploy** the project

4. **Check function logs**
   - Look for environment variable status
   - Verify MONGO_URI is being read

5. **Test again**
   - `/debug/env` should show all variables exist
   - `/health` should work
   - Database should connect

---

## 📝 Example: Setting MONGO_URI

1. Go to Vercel Dashboard → Your API Project
2. Settings → Environment Variables
3. Click **Add New**
4. **Key:** `MONGO_URI`
5. **Value:** `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority`
6. **Environment:** Select **Production** (and Preview if needed)
7. Click **Save**
8. **Go to Deployments → Redeploy**
9. Test: `curl https://your-api.vercel.app/debug/env`

---

## 🎯 Next Steps

After verifying environment variables:

1. ✅ Test `/health` endpoint
2. ✅ Test `/api/v1` endpoint  
3. ✅ Check function logs for database connection
4. ✅ Test a database endpoint (e.g., `/api/v1/products`)

If variables are loading but you still get 500 errors, the issue is likely:
- MongoDB connection (check MONGO_URI format)
- MongoDB Atlas network access (must allow 0.0.0.0/0)
- Database credentials incorrect
