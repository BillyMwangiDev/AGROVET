# Nicmah Agrovet — CLAUDE.md

## Project Overview
Agricultural e-commerce + POS system for Nicmah Agrovet.
**Location:** Naromoru Town, Timberland Building
**Shop:** 0726 476 128 | **Vet:** 0721 908 023 | **WhatsApp:** +254740368581

---

## Stack
| Layer | Technology | Location |
|-------|-----------|----------|
| Backend | Django 5.x + DRF + SimpleJWT | `backend/` |
| Frontend | React 19 + TypeScript + Vite + TanStack Query | `app/` |
| Database | PostgreSQL (prod), SQLite (dev) | — |
| Styling | Tailwind CSS + shadcn/ui | `app/src/components/ui/` |

---

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # fill in DB credentials
python manage.py migrate
python manage.py loaddata inventory/fixtures/initial_products.json
python manage.py createsuperuser
python manage.py runserver
```
Backend: http://localhost:8000/admin/

### Frontend
```bash
cd app
npm install
# Create app/.env.local:
# VITE_API_URL=http://localhost:8000
# VITE_WHATSAPP_PHONE=254721908023
npm run dev
```
Frontend: http://localhost:5173

---

## Design Tokens
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#0B3A2C` | Sidebar, primary buttons |
| Accent | `#E4B83A` | Gold highlights, secondary CTAs |
| Background | `#F6F7F6` | Page background |
| Text | `#111915` | Body text |
| Muted | `#6B7A72` | Labels, subtitles |

---

## Business Rules
- **Currency:** KES (Kenyan Shilling) — format as `KES 8,500`
- **VAT:** 16% applied at POS checkout (`tax = subtotal * 0.16`)
- **Receipt number:** `NIC-YYYYMMDD-NNN` (daily sequence, e.g. `NIC-20240320-001`)
- **Stock deduction:** ALWAYS use `select_for_update()` inside `@transaction.atomic`
- **Semen products:** `is_ai_product=True`, breed traits in `genetic_traits` JSONField
- **Walk-in customers:** store name + phone as strings on `Sale` (no FK required)
- **WhatsApp number:** read from `VITE_WHATSAPP_PHONE` env — never hardcode

---

## Django Apps
| App | Models | Responsibility |
|-----|--------|---------------|
| `inventory` | Category, Product | Products, stock levels, Excel import |
| `pos` | Sale, SaleItem, Customer, AIRecord | Transactions, receipts, AI records |
| `users` | (Django auth) | SimpleJWT auth views |

### Settings Structure
```
backend/agrovet/settings/
├── base.py          # Shared settings
├── development.py   # SQLite, DEBUG=True, CORS localhost:5173
└── production.py    # PostgreSQL from env vars
```
Default: `DJANGO_SETTINGS_MODULE=agrovet.settings.development`

---

## API Endpoints Reference
| Method | URL | Auth | Purpose |
|--------|-----|------|---------|
| POST | `/api/auth/token/` | None | Get JWT tokens |
| POST | `/api/auth/token/refresh/` | None | Refresh JWT |
| GET | `/api/auth/me/` | Bearer | Current user info |
| GET | `/api/products/` | None | Public product list (`?category=feeds&is_ai=true`) |
| GET | `/api/admin/inventory/` | Bearer | Full inventory with stock |
| PATCH | `/api/admin/inventory/{id}/adjust-stock/` | Bearer | Adjust stock level |
| POST | `/api/admin/import-excel/` | Bearer | Bulk import from .xlsx |
| POST | `/api/pos/sale/` | Bearer | Create sale + deduct stock |
| GET/POST | `/api/customers/` | Bearer | Customer list / create |
| GET/POST | `/api/ai-records/` | Bearer | AI records list / create |
| PATCH | `/api/ai-records/{id}/` | Bearer | Update AI record status |
| GET | `/api/analytics/dashboard/` | Bearer | Today's stats |
| GET | `/api/analytics/sales-trend/` | Bearer | `?days=7` weekly data |
| GET | `/api/analytics/category-split/` | Bearer | Category revenue breakdown |

---

## Frontend Conventions

### File Organization
```
app/src/
├── api/          # Pure axios call functions (NO business logic)
├── hooks/        # TanStack Query wrappers (use*.ts)
├── contexts/     # React contexts (AuthContext.tsx)
├── components/   # UI components
│   ├── ui/       # shadcn base components
│   ├── dashboard/# Admin dashboard panels
│   └── pos/      # POS terminal
├── pages/        # Route-level pages
├── sections/     # Landing page sections
└── utils/        # Helpers (formatCurrency, receipt, whatsapp)
```

### Rules
- Components import from `@/hooks/`, NEVER from `@/api/` directly
- IDs are always `string` type (UUID serialized from backend)
- Dates: backend returns ISO strings → `new Date(isoStr)` to convert
- Prices: Django `DecimalField` → string in JSON → use `parseDecimal(str)` for math
- Never use `any` in TypeScript
- Never hardcode WhatsApp phone — use `import.meta.env.VITE_WHATSAPP_PHONE`

### Key Utilities
| Utility | Purpose |
|---------|---------|
| `parseDecimal(val)` | Converts Django decimal strings to JS number |
| `formatKES(amount)` | Formats number as "KES 8,500" |
| `buildWhatsAppCheckoutURL(cart, phone)` | Builds `wa.me/...` order URL |
| `printReceipt(html)` | Opens popup + triggers window.print() |

---

## Authentication Flow
1. `POST /api/auth/token/` → `{access, refresh}`
2. Store in `localStorage` as `access_token` / `refresh_token`
3. `axios` request interceptor attaches `Authorization: Bearer <token>`
4. On 401 response: clear tokens + redirect to `/login`
5. `/admin/*` routes wrapped in `<ProtectedRoute>` component

---

## Stock Safety Pattern
```python
# pos/views.py — ALWAYS use this pattern for stock deduction
@transaction.atomic
def create(self, request):
    product_ids = [item['product'] for item in items_data]
    # 1. Lock rows first
    products = Product.objects.select_for_update().filter(id__in=product_ids)
    # 2. Validate ALL stock BEFORE any writes
    for item in items_data:
        product = next(p for p in products if str(p.id) == item['product'])
        if product.stock_level < item['quantity']:
            raise ValidationError({"stock_errors": [f"Insufficient stock for {product.name}"]})
    # 3. Write after all checks pass
    for item in items_data:
        product.stock_level = F('stock_level') - item['quantity']
        product.save(update_fields=['stock_level'])
```

---

## DO NOT
- Import from `@/data/mockData` in any component
- Use `any` type in TypeScript
- Hardcode the WhatsApp phone number
- Skip `select_for_update()` on any stock deduction view
- Store tokens anywhere except `localStorage`
- Commit `.env` files (only `.env.example`)
