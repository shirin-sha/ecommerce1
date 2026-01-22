# E-Commerce Platform

> Production-grade single-vendor e-commerce platform inspired by WooCommerce workflows, built with modern tech stack.

## 🚀 Features

- **Complete E-Commerce Workflow**: Product browse, cart, checkout, order management
- **WooCommerce-Inspired Admin**: Familiar UX for store management
- **Variable Products**: Support for product variations (size, color, etc.)
- **Advanced Analytics**: Revenue, orders, products, categories analytics with date comparison
- **Coupon System**: Percentage and fixed discounts with restrictions
- **Multi-Payment Support**: PayPal, MyFatoorah, Cash on Delivery
- **Review System**: Product reviews with moderation
- **Customer Management**: Track orders, spend, AOV
- **Inventory Management**: Stock tracking, low stock alerts
- **Shipping Zones**: Configure shipping methods by region
- **Email Notifications**: Automated emails for order status changes
- **Analytics Tracking**: GA4, Meta Pixel, TikTok Pixel integration

## 📦 Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- TanStack Query + TanStack Table
- React Hook Form + Zod
- Recharts

### Backend
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (Email)

### DevOps
- pnpm workspaces (monorepo)
- Docker + Docker Compose

## 🏗️ Project Structure

```
ecommerce1/
├── apps/
│   ├── api/          # Backend API (Express + MongoDB)
│   ├── admin/        # Admin dashboard (React)
│   └── storefront/   # Customer-facing store (React)
├── packages/
│   └── shared/       # Shared types, schemas, utilities
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   └── API.md
└── docker-compose.yml
```

## 🛠️ Setup

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose

### Quick Start

1. **Clone the repository**
```bash
git clone <repo-url>
cd ecommerce1
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
docker-compose up -d
```

5. **Run development servers**
```bash
# Start all apps in parallel
pnpm dev

# Or start individually:
pnpm dev:api          # API on http://localhost:5000
pnpm dev:admin        # Admin on http://localhost:3001
pnpm dev:storefront   # Storefront on http://localhost:3000
```

6. **Seed demo data** (optional)
```bash
pnpm seed
```

## 📖 Documentation

- [Architecture Specification](./docs/ARCHITECTURE.md)
- [Setup Guide](./docs/SETUP.md)
- [API Documentation](./docs/API.md)

## 🎯 Development Roadmap

- [x] Architecture specification + UI parity checklist
- [ ] **Milestone 1**: Foundation (Monorepo, Auth, DB)
- [ ] **Milestone 2**: Core Commerce (Products, Categories, Variations)
- [ ] **Milestone 3**: Orders & Customers
- [ ] **Milestone 4**: Coupons, Reviews, Settings
- [ ] **Milestone 5**: Analytics & Reports
- [ ] **Milestone 6**: Payments & Storefront Polish
- [ ] **Milestone 7**: Email, Testing, Docs

## 📝 License

MIT

---

**Built with ❤️ inspired by WooCommerce**
