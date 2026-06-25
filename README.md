# Smience Life Science — Inventory Management

A modern, responsive web app for managing pharmaceutical inventory. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Mongoose, and JWT cookie-based authentication.

## Features

- 🔐 **Auth** — login, registration, forgot password, JWT cookies, role-based redirects
- 👥 **Roles** — `admin`, `manager`, `seller`, `vendor` with granular permissions
- 📊 **Admin dashboard** — KPIs, low-stock alerts, expiry alerts, recent sales, audit feed
- 📦 **Products** — full CRUD with drag-and-drop multi-image upload, SKU/barcode, batch & expiry
- 🔄 **Inventory sync** — every adjustment (sale, vendor delivery, manual edit) writes to the audit log and notifies admins
- 🧾 **Sales / stock updates** — sellers, vendors and managers can record sales or stock adjustments with reasons
- 🔔 **Notifications** — inventory updates, low-stock, expiry, new products, approvals
- 📈 **Reports** — sales, stock, low stock, expiry and user activity with CSV export
- 📱 **Responsive UI** — mobile drawer, sticky sidebar on desktop, soft pharma palette
- 🛡️ **Security** — bcrypt password hashing, JWT cookies, role-checked API routes, server-side redirects

## Quick start

```bash
cp .env.example .env       # then edit MONGODB_URI and JWT_SECRET
npm install
npm run seed               # populates demo users + products (password: Demo@123)
npm run dev                # http://localhost:3000
```

### Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@pharmacare.test` | `Demo@123` |
| Manager | `manager@pharmacare.test` | `Demo@123` |
| Seller | `seller@pharmacare.test` | `Demo@123` |
| Vendor | `vendor@pharmacare.test` | `Demo@123` |

> You can also change the admin's password from the login page (`Admin@123` is shown pre-filled as a hint).

## MongoDB collections

- `users` — account, role, password hash, status, last login
- `products` — product master with embedded image metadata and computed status
- `inventoryhistories` — append-only audit log of every stock change
- `sales` — sales line items with customer + payment metadata
- `notifications` — in-app notifications targeted by role/user
- `vendors` — vendor directory
- `settings` — key/value app preferences

## API overview

| Method | Path | Description | Permission |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Email/password login, sets cookie | public |
| POST | `/api/auth/register` | Self-register as seller/vendor/manager (status pending) | public |
| POST | `/api/auth/forgot` | Stub password reset | public |
| POST | `/api/auth/logout` | Clear cookie | any |
| GET | `/api/products` | List/filter products | auth |
| POST | `/api/products` | Create product | products:write |
| GET | `/api/products/:id` | Read product | auth |
| PUT | `/api/products/:id` | Update product (creates history on qty change) | products:write |
| DELETE | `/api/products/:id` | Remove product | products:delete |
| GET | `/api/inventory` | Inventory history | auth |
| POST | `/api/inventory` | Adjust stock, writes history + notification | inventory:write |
| GET | `/api/sales` | List sales (sellers see their own) | auth |
| POST | `/api/sales` | Record sale, decrements stock | sales:write |
| GET | `/api/users` | List users | admin |
| POST | `/api/users` | Create user | admin |
| PATCH | `/api/users/:id` | Update status/role | admin |
| DELETE | `/api/users/:id` | Remove user (not admins) | admin |
| GET | `/api/notifications` | Notifications for current user | auth |
| PATCH | `/api/notifications/:id` | Mark as read | auth |
| GET | `/api/reports?kind=…` | Sales/stock/expiry/user reports | auth |
| POST | `/api/upload` | Multipart image upload (saves to `public/uploads`) | auth |

## Tech notes

- All MongoDB access is centralised in `src/lib/db.ts` using a cached global connection.
- The middleware (`src/middleware.ts`) reads the JWT cookie and redirects unauthenticated users away from `/dashboard`, `/products`, etc.
- `src/lib/roles.ts` is the single source of truth for permissions and role-home redirects.
- The UI ships with realistic seed data; once your MongoDB is connected, run `npm run seed` for instant content.
