# Quick Deployment Reference

## 🚀 Fast Track Deployment

### Prerequisites Checklist
- [ ] MongoDB Atlas cluster ready
- [ ] Connection string copied
- [ ] JWT secrets generated (2x, 32+ chars each)
- [ ] Code pushed to GitHub

### Deployment URLs
After deployment, you'll have:
- **API**: `https://your-api-name.vercel.app`
- **Admin**: `https://your-admin-name.vercel.app`
- **Storefront**: `https://your-storefront-name.vercel.app`

---

## Step-by-Step (5 Minutes)

### 1. Deploy API (2 min)
```
1. Go to vercel.com/new
2. Import repository
3. Root Directory: apps/api
4. Framework: Other
5. Install Command: cd ../.. && pnpm install
6. Deploy
7. Add env vars:
   - MONGO_URI=your-connection-string
   - JWT_SECRET=your-secret
   - JWT_REFRESH_SECRET=your-refresh-secret
   - NODE_ENV=production
8. Redeploy
```

### 2. Deploy Admin (1 min)
```
1. Go to vercel.com/new
2. Import same repository
3. Root Directory: apps/admin
4. Framework: Vite
5. Build Command: cd ../.. && pnpm --filter admin build
6. Output Directory: dist
7. Install Command: cd ../.. && pnpm install
8. Deploy
9. Add env var: VITE_API_URL=https://your-api.vercel.app
10. Redeploy
```

### 3. Deploy Storefront (1 min)
```
1. Go to vercel.com/new
2. Import same repository
3. Root Directory: apps/storefront
4. Framework: Vite
5. Build Command: cd ../.. && pnpm --filter storefront build
6. Output Directory: dist
7. Install Command: cd ../.. && pnpm install
8. Deploy
9. Add env var: VITE_API_URL=https://your-api.vercel.app
10. Redeploy
```

### 4. Update API CORS (1 min)
```
1. Go to API project → Settings → Environment Variables
2. Add:
   - ADMIN_URL=https://your-admin.vercel.app
   - STOREFRONT_URL=https://your-storefront.vercel.app
3. Redeploy API
```

---

## Environment Variables Cheat Sheet

### API (`apps/api`)
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=min-32-characters-secret
JWT_REFRESH_SECRET=min-32-characters-secret
NODE_ENV=production
ADMIN_URL=https://your-admin.vercel.app
STOREFRONT_URL=https://your-storefront.vercel.app
```

### Admin (`apps/admin`)
```
VITE_API_URL=https://your-api.vercel.app
```

### Storefront (`apps/storefront`)
```
VITE_API_URL=https://your-api.vercel.app
```

---

## Verification Commands

```bash
# Test API
curl https://your-api.vercel.app/health

# Test API info
curl https://your-api.vercel.app/api/v1

# Visit in browser
# Admin: https://your-admin.vercel.app
# Storefront: https://your-storefront.vercel.app
```

---

## Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Database connection fails | Check MONGO_URI, verify Atlas network access (0.0.0.0/0) |
| CORS errors | Update ADMIN_URL and STOREFRONT_URL in API env vars, redeploy |
| Build fails | Check install command runs from root: `cd ../.. && pnpm install` |
| Blank page | Verify vercel.json rewrites exist, check outputDirectory is `dist` |
| Env vars not working | For Vite: must start with `VITE_`, redeploy after adding |

---

## Full Documentation

For detailed instructions, troubleshooting, and best practices, see:
- **Complete Guide**: `VERCEL_DEPLOYMENT_COMPLETE.md`
- **Original Guide**: `VERCEL_DEPLOYMENT.md`
