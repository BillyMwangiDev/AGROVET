# Nicmah Agrovet — Feature Roadmap & Build Plan

## What Was Built

### Backend (Django 5.x)
- [x] **Phase 1:** Django project scaffold with split settings (dev/prod)
- [x] **Phase 2:** `inventory` app — Category + Product models + seed fixtures (13 products)
- [x] **Phase 3:** `pos` app — Sale, SaleItem, Customer, AIRecord models
- [x] **Phase 4:** SimpleJWT auth — login, refresh, `/api/auth/me/`
- [x] **Phase 5:** Inventory serializers + views + URLs (public + admin)
- [x] **Phase 6:** POS sale endpoint with `select_for_update()` + thermal receipt HTML
- [x] **Phase 7:** Excel import service via pandas `update_or_create()`
- [x] **Phase 8:** Analytics views — dashboard stats, sales trend, category split

### Frontend (React + Vite)
- [x] **Phase 9:** API client (axios + JWT interceptors), TanStack Query hooks, utilities
- [x] **Phase 10:** Landing page Products section wired to real API + WhatsApp checkout
- [x] **Phase 11:** Admin dashboard panels all connected to real API
  - DashboardOverview, InventoryManager, Customers, AIRecords, Analytics
- [x] **Phase 12:** POS Terminal — real `createSale` mutation, thermal print, out-of-stock guards
- [x] **Phase 12:** ExcelImport — real `POST /api/admin/import-excel/` with multipart upload
- [x] **Phase 13:** Authentication — LoginPage, ProtectedRoute, AuthContext, logout
- [x] **Phase 14:** CLAUDE.md + plan.md created

---

## Setup Checklist (First Time)

### Backend
```bash
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set SECRET_KEY, DB credentials
python manage.py migrate
python manage.py loaddata inventory/fixtures/initial_products.json
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd app
npm install
# Create app/.env.local:
echo "VITE_API_URL=http://localhost:8000" >> .env.local
echo "VITE_WHATSAPP_PHONE=254721908023" >> .env.local
npm run dev
```

---

## Architecture Overview

```
Browser
  ├── Public Storefront (/)
  │     ├── Landing page with product catalog
  │     └── WhatsApp checkout button → wa.me/254721908023
  └── Admin Dashboard (/admin/*)  [Protected: JWT required]
        ├── Overview        — Daily stats + sales trend chart
        ├── POS Terminal    — Barcode-style checkout with thermal receipt
        ├── Inventory       — Stock management + low-stock alerts
        ├── AI Records      — Artificial insemination booking + status tracking
        ├── Customers       — Customer database
        ├── Analytics       — Revenue trends + category breakdown
        └── Excel Import    — Bulk product import from .xlsx

Django REST API (localhost:8000)
  ├── /api/auth/           — SimpleJWT token endpoints
  ├── /api/products/       — Public product catalog
  ├── /api/admin/          — Protected inventory management
  ├── /api/pos/            — Sales, customers, AI records
  └── /api/analytics/      — Dashboard metrics
```

---

## Pending / Future Work

### High Priority
- [ ] **Run migrations** in a real Python environment and verify schema
- [ ] **Load fixtures** and test API responses match frontend expectations
- [ ] **End-to-end test** the POS sale flow (create sale → stock decrements → receipt prints)
- [ ] **PostgreSQL setup** for staging/production (SQLite is dev-only)

### Enhancements
- [x] **M-Pesa STK Push** integration for mobile payments (Daraja API, STK Push + callback + status polling)
- [x] **Low-stock email alerts** via Django signals + SMTP
- [x] **Barcode scanning** in POS via `BarcodeDetector` Web API (native, no npm install)
- [x] **PDF receipts** via `reportlab` — download button in POS after sale
- [x] **Product images** — `ImageField` storage + display in POS grid
- [x] **Expiry date alerts** for feeds/chemicals approaching expiry
- [ ] **Multi-location** inventory (e.g., multiple agrovets under one account)
- [x] **Customer loyalty points** system (1 pt per KES 100 spent, badge in Customers panel)
- [x] **Offline POS mode** with vite-plugin-pwa + workbox service worker (NetworkFirst for /api/products/)

### DevOps
- [x] Docker Compose setup (django + postgres + nginx)
- [x] GitHub Actions CI (lint + Django check + npm build on push)
- [ ] Deploy backend to Railway / Render
- [ ] Deploy frontend to Vercel / Netlify

---

## Key Data Relationships

```
Category (1) ──→ (*) Product
                      │
                      ├──→ SaleItem (*) ──→ (1) Sale ──→ (?) Customer
                      │
                      └──→ AIRecord (semen_product FK, is_ai_product=True)

Sale
  ├── receipt_number: NIC-YYYYMMDD-NNN
  ├── payment_method: cash | mpesa | card
  ├── subtotal + tax(16%) - discount = total
  └── SaleItem[]: product_snapshot + quantity + line_total
```

---

## Environment Variables Reference

### Backend `.env`
```
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgres://user:pass@localhost:5432/agrovet
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend `app/.env.local`
```
VITE_API_URL=http://localhost:8000
VITE_WHATSAPP_PHONE=254721908023
```
