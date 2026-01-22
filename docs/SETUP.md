# Setup Guide

This guide will help you get the e-commerce platform up and running on your local machine.

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** & **Docker Compose** (for MongoDB)
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone <repo-url>
cd ecommerce1
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install dependencies for all workspaces (apps/api, apps/admin, apps/storefront, packages/shared).

### 3. Environment Setup

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration. At minimum, update:

```env
# JWT Secrets (IMPORTANT: Change these in production!)
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key

# SMTP Email (use Mailtrap for testing)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password
```

### 4. Start MongoDB

```bash
docker-compose up -d
```

This will start MongoDB on `localhost:27017`.

To verify MongoDB is running:

```bash
docker ps
```

You should see `ecommerce-mongo` in the list.

### 5. Start Development Servers

**Option A: Start all apps in parallel**

```bash
pnpm dev
```

This will start:
- API on `http://localhost:5000`
- Admin on `http://localhost:3001`
- Storefront on `http://localhost:3000`

**Option B: Start apps individually**

In separate terminal windows:

```bash
# Terminal 1: API
pnpm dev:api

# Terminal 2: Admin Dashboard
pnpm dev:admin

# Terminal 3: Storefront
pnpm dev:storefront
```

### 6. Access the Applications

- **Storefront**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
- **API**: http://localhost:5000/api/v1

## Seed Demo Data (Optional)

To populate the database with demo products, categories, and users:

```bash
pnpm seed
```

## Testing the Setup

### Test API Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-22T12:00:00.000Z"
}
```

### Test User Registration

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "Test1234"
  }'
```

## Project Structure

```
ecommerce1/
├── apps/
│   ├── api/          # Backend API (Express + MongoDB)
│   ├── admin/        # Admin dashboard (React)
│   └── storefront/   # Customer storefront (React)
├── packages/
│   └── shared/       # Shared types, schemas, utilities
├── docs/             # Documentation
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## Development Workflow

### Building for Production

```bash
# Build all apps
pnpm build

# Or build individually
pnpm --filter api build
pnpm --filter admin build
pnpm --filter storefront build
```

### Type Checking

```bash
# Check types for all workspaces
pnpm typecheck
```

### Stopping MongoDB

```bash
docker-compose down
```

### Clearing MongoDB Data

```bash
docker-compose down -v
```

This will remove all data from MongoDB.

## Common Issues

### Port Already in Use

If you see "Port 5000 is already in use" or similar:

1. Check what's using the port:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Mac/Linux
   lsof -i :5000
   ```

2. Kill the process or change the port in `.env`:
   ```env
   PORT=5001
   ```

### MongoDB Connection Error

If the API fails to connect to MongoDB:

1. Ensure Docker is running
2. Check MongoDB container status: `docker ps`
3. Check MongoDB logs: `docker logs ecommerce-mongo`
4. Verify MONGO_URI in `.env` is correct

### pnpm Command Not Found

Install pnpm globally:

```bash
npm install -g pnpm
```

## Next Steps

- Review the [Architecture Documentation](./ARCHITECTURE.md)
- Explore the [API Documentation](./API.md)
- Check the [WooCommerce Reference Screenshots](./woocommerce-reference/)

## Need Help?

If you encounter any issues:

1. Check the terminal logs for errors
2. Review this setup guide again
3. Check the MongoDB connection
4. Verify all dependencies are installed
5. Ensure Node.js and pnpm versions meet requirements

---

**Happy coding! 🚀**
