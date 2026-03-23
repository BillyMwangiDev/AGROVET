# Security Reference — Nicmah Agrovet (Django + React + nginx)

> Reusable checklist and code patterns for production-ready web apps.
> Based on OWASP Top 10, Django security docs, and lessons from this project.

---

## Table of Contents
1. [Secret Management](#1-secret-management)
2. [Authentication & JWT](#2-authentication--jwt)
3. [CORS](#3-cors)
4. [Rate Limiting](#4-rate-limiting)
5. [Input Validation & DTOs](#5-input-validation--dtos)
6. [Error Handling](#6-error-handling)
7. [Webhook Signature Verification](#7-webhook-signature-verification)
8. [HTTP Security Headers](#8-http-security-headers)
9. [Structured Logging](#9-structured-logging)
10. [HTTPS & TLS](#10-https--tls)
11. [Database Security](#11-database-security)
12. [Dependency Management](#12-dependency-management)
13. [Frontend Security](#13-frontend-security)
14. [Scale & Performance](#14-scale--performance)
15. [OWASP Top 10 Checklist](#15-owasp-top-10-checklist)
16. [Production Go-Live Checklist](#16-production-go-live-checklist)

---

## 1. Secret Management

### Rules
- **Never hardcode secrets** in source code — no API keys, passwords, tokens, or connection strings.
- **Never commit `.env`** to source control. Only commit `.env.example` with placeholder values.
- Use environment variables for all secrets. Fail loudly at startup if required secrets are missing.

### Django pattern — fail loudly on missing SECRET_KEY
```python
_secret = os.environ.get("SECRET_KEY", "")
if not _secret:
    if os.environ.get("DJANGO_SETTINGS_MODULE", "").endswith("production"):
        raise ImproperlyConfigured("SECRET_KEY environment variable must be set in production.")
    _secret = "django-insecure-dev-only"
SECRET_KEY = _secret
```

### Generate secrets
```bash
# Django SECRET_KEY
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Random token (e.g. webhook secret, API key)
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### What to put in .env.example
```
SECRET_KEY=CHANGE-ME-generate-with-command-above
MPESA_CALLBACK_SECRET=CHANGE-ME-generate-with-command-above
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 2. Authentication & JWT

### Django SimpleJWT recommended settings
```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,   # invalidate old refresh tokens
    "AUTH_HEADER_TYPES": ("Bearer",),
}
# Required to use BLACKLIST_AFTER_ROTATION:
INSTALLED_APPS += ["rest_framework_simplejwt.token_blacklist"]
# Run: python manage.py migrate
```

### Token refresh on the frontend (axios interceptor)
When an access token expires, the interceptor silently refreshes it and retries the original
request. Multiple concurrent requests are queued — only one refresh call is made.

```typescript
let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);
    original._retry = true;

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) { redirectToLogin(); return Promise.reject(error); }

    if (isRefreshing) {
      return new Promise<string>((resolve) => { refreshQueue.push(resolve); })
        .then((newToken) => { original.headers.Authorization = `Bearer ${newToken}`; return apiClient(original); });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post("/api/auth/token/refresh/", { refresh: refreshToken });
      localStorage.setItem("access_token", data.access);
      if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
      refreshQueue.forEach((resolve) => resolve(data.access));
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(original);
    } catch { redirectToLogin(); return Promise.reject(error); }
    finally { isRefreshing = false; }
  }
);
```

### What NOT to do
- Do not use `BLACKLIST_AFTER_ROTATION = False` — old refresh tokens remain valid after logout.
- Do not return `password`, `pin`, or tokens in API responses. Use `write_only=True` on serializer fields.
- Do not expose internal user IDs in public-facing URLs (use UUIDs, not sequential integers).

---

## 3. CORS

### Django — strict production config
```python
# In production.py — raise if not set
_cors = os.environ.get("CORS_ALLOWED_ORIGINS", "")
if not _cors:
    raise ImproperlyConfigured("CORS_ALLOWED_ORIGINS must be set in production.")
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = True
```

### Rules
- Never use `CORS_ALLOW_ALL_ORIGINS = True` in production.
- Only list your exact frontend domains — no trailing slashes, no wildcards.
- `CORS_ALLOW_CREDENTIALS = True` is required when sending Authorization headers or cookies.

---

## 4. Rate Limiting

### Django REST Framework — custom throttle per email
DRF's default `AnonRateThrottle` limits by IP. This can be bypassed via NAT.
Rate-limit by the submitted email/username instead:

```python
# users/throttles.py
from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    scope = "login"

    def get_cache_key(self, request, view):
        ident = (request.data.get("username") or request.data.get("email") or "").lower().strip()
        if not ident:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
```

```python
# settings/base.py
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",
        "user": "300/min",
        "login": "3/hour",      # per email
        "pin_verify": "3/hour", # per user_id
    },
}
```

```python
# Apply to view
class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]
```

### nginx — rate limit zones
```nginx
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/m;

location ~ ^/api/auth/(token|pin-verify|signup)/ {
    limit_req zone=auth_limit burst=3 nodelay;
    limit_req_status 429;
    proxy_pass http://backend;
}
```

---

## 5. Input Validation & DTOs

### Rules
- Validate ALL incoming data at the API boundary. Never trust client input.
- Use DRF serializers as DTOs — they prevent unexpected fields from reaching business logic.
- Use `ChoiceField` for enums, `max_length` on all `CharField`, `max_digits`/`decimal_places` on all `DecimalField`.
- Mark sensitive fields as `write_only=True` so they cannot be read back.

```python
class SaleCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=["cash", "mpesa", "card"])
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    items = SaleItemCreateSerializer(many=True, min_length=1)

class StoreSettingsSerializer(serializers.ModelSerializer):
    mpesa_consumer_secret = serializers.CharField(write_only=True, required=False, allow_blank=True)
    mpesa_passkey = serializers.CharField(write_only=True, required=False, allow_blank=True)
```

---

## 6. Error Handling

### Rules
- **Never return raw exception messages** to API clients — they leak internal details.
- **Log** the full exception server-side; return a generic message to the client.
- Use correct HTTP status codes: 400 (bad input), 401 (unauthenticated), 403 (forbidden),
  404 (not found), 429 (rate limited), 500 (server error).
- Never expose database errors, stack traces, or internal service details in responses.

```python
import logging
logger = logging.getLogger(__name__)

try:
    result = external_service_call()
except Exception as exc:
    logger.error("Service call failed: %s", exc, exc_info=True)
    return Response(
        {"detail": "Request failed. Please try again."},
        status=status.HTTP_502_BAD_GATEWAY,
    )
```

### Django DEBUG setting
```python
# production.py
DEBUG = False   # Never True in production — Django shows stack traces when True
```

---

## 7. Webhook Signature Verification

### M-Pesa (Safaricom Daraja)
Safaricom does not sign callbacks with HMAC. The recommended approach is to embed a
secret token in the callback URL path so only the recipient who registered the URL can
identify valid requests.

```python
# settings/base.py
MPESA_CALLBACK_SECRET = os.environ.get("MPESA_CALLBACK_SECRET", "")

# pos/views.py
class MpesaCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, callback_secret: str):
        expected = settings.MPESA_CALLBACK_SECRET
        if not expected or callback_secret != expected:
            logger.warning("M-Pesa callback: invalid secret token")
            return Response(status=status.HTTP_403_FORBIDDEN)
        # ... process callback ...

# pos/urls.py
path("mpesa/callback/<str:callback_secret>/", MpesaCallbackView.as_view())
```

### Stripe / other HMAC-based webhooks
```python
import hmac, hashlib

def verify_stripe_signature(payload: bytes, sig_header: str, secret: str) -> bool:
    parts = dict(item.split("=", 1) for item in sig_header.split(","))
    timestamp = parts.get("t", "")
    signatures = [v for k, v in parts.items() if k == "v1"]
    signed_payload = f"{timestamp}.{payload.decode()}"
    expected = hmac.new(secret.encode(), signed_payload.encode(), hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, sig) for sig in signatures)
```

---

## 8. HTTP Security Headers

### Django production settings
```python
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31_536_000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
```

### nginx security headers
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none';" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

### Verify headers
```bash
curl -sI https://yourdomain.com | grep -E "Strict|Frame|Content-Type|Referrer|Security"
```

---

## 9. Structured Logging

### Goals
- Every log entry has: timestamp, level, logger name, request ID, message.
- request_id correlates all log lines for a single HTTP request.
- Logs are written to a rotating file (never to stdout only in production).
- Use `logger.error(msg, exc_info=True)` instead of `print()` or `raise`.

### RequestID middleware
```python
# agrovet/middleware.py
import logging, threading, uuid
_local = threading.local()

def get_request_id() -> str:
    return getattr(_local, "request_id", "-")

class RequestIDMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _local.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
        response = self.get_response(request)
        response["X-Request-ID"] = _local.request_id
        return response

class RequestIDFilter(logging.Filter):
    def filter(self, record):
        record.request_id = get_request_id()
        return True
```

### Logging config (settings/base.py)
```python
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "format": '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","request_id":"%(request_id)s","message":"%(message)s"}',
        },
    },
    "filters": {"request_id": {"()": "agrovet.middleware.RequestIDFilter"}},
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "json", "filters": ["request_id"]},
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs/app.log",
            "maxBytes": 10_000_000,
            "backupCount": 5,
            "formatter": "json",
            "filters": ["request_id"],
        },
    },
    "root": {"handlers": ["console", "file"], "level": "WARNING"},
    "loggers": {
        "myapp": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
    },
}
```

---

## 10. HTTPS & TLS

### nginx HTTPS server block
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    # ... location blocks ...
}
```

### Get a free cert with Certbot
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 11. Database Security

### Stock deduction — always use select_for_update()
```python
@transaction.atomic
def create_sale(items_data):
    product_ids = [item["product"] for item in items_data]
    products = Product.objects.select_for_update().filter(id__in=product_ids)
    # 1. Validate ALL stock before any write
    for item in items_data:
        product = next(p for p in products if str(p.id) == item["product"])
        if product.stock_level < item["quantity"]:
            raise ValidationError({"stock_errors": [f"Insufficient stock for {product.name}"]})
    # 2. Write only after all checks pass
    for item in items_data:
        product.stock_level = F("stock_level") - item["quantity"]
        product.save(update_fields=["stock_level"])
```

### Indexing strategy
Add database indexes for high-frequency lookups:
```python
class Sale(models.Model):
    created_at = models.DateTimeField(db_index=True)

class MpesaTransaction(models.Model):
    checkout_request_id = models.CharField(unique=True)  # unique implies index

class Customer(models.Model):
    phone = models.CharField(db_index=True)

class StockLog(models.Model):
    class Meta:
        indexes = [models.Index(fields=["product", "created_at"])]
```

### Never expose DB errors
```python
except Exception as exc:
    logger.error("DB operation failed: %s", exc, exc_info=True)
    return Response({"detail": "Operation failed."}, status=500)
```

---

## 12. Dependency Management

### Pin exact versions in production
```
Django==5.1.7
djangorestframework==3.15.2
requests==2.32.3
```
Wildcards (`5.1.*`) can silently pull in breaking or vulnerable minor releases.

### Audit regularly
```bash
# Python
pip-audit
safety check

# Node
npm audit
npm audit fix
```

### Update workflow
1. Check changelog for security advisories.
2. Update one package at a time in a branch.
3. Run full test suite before merging.

---

## 13. Frontend Security

### Token storage trade-offs
| Storage | XSS risk | CSRF risk | Notes |
|---------|----------|-----------|-------|
| localStorage | High | Low | Simple, vulnerable to XSS |
| sessionStorage | High | Low | Cleared on tab close |
| httpOnly cookie | None | Medium | Needs CSRF protection |

For this project: localStorage is used for simplicity. Mitigate with DOMPurify on all
user-generated HTML, strict CSP, and no `eval()`.

### XSS prevention
- Use `DOMPurify.sanitize(html)` before `dangerouslySetInnerHTML`.
- Set a strict Content-Security-Policy header.
- Never use `eval()`, `new Function()`, or `innerHTML` with user content.

### No console.log in production
```typescript
// Bad
console.log("token:", token);

// Good — only logs in dev builds
if (import.meta.env.DEV) {
  console.warn("Debug:", value);
}
```

### Redirect validation
Never redirect to user-controlled URLs. Always use hardcoded paths:
```typescript
window.location.href = "/login";  // Safe — hardcoded
// Not: window.location.href = params.get("next");  // Unsafe — open redirect
```

### Generic error messages to users
```typescript
// Bad — leaks internal details
toast.error(error.response?.data?.detail);

// Good — generic user message; log detail server-side
toast.error("Something went wrong. Please try again.");
```

---

## 14. Scale & Performance

### This project's scale estimate (small agrovet, ~2026)
| Metric | Estimate |
|--------|----------|
| Daily API requests | 200–500 |
| Sales per day | 50–150 |
| DB size after 1 year | < 200 MB |
| Concurrent users | < 10 |
| Required servers | 1 (single VPS/droplet) |

### Read vs. write
~80% reads (product browsing, dashboard polling), ~20% writes (sales, stock updates).
Read-heavy endpoints benefit most from caching.

### Caching strategy
```python
from django.core.cache import cache

def get_products():
    key = "product_list"
    cached = cache.get(key)
    if cached is not None:
        return cached
    qs = Product.objects.filter(is_active=True).select_related("category")
    cache.set(key, list(qs), timeout=300)  # 5 minutes
    return qs
```

| Endpoint | Cache TTL | Reason |
|----------|-----------|--------|
| Product list | 5 min | Changes rarely |
| Analytics dashboard | 1 hour | Heavy aggregation |
| Category list | 1 day | Near-static |

### Bottlenecks to watch
- **M-Pesa STK polling**: polling every 3s per transaction. Limit polling to 12 cycles (36s total).
- **PDF generation**: reportlab is synchronous. For high volume, move to a task queue (Celery).
- **Excel import**: pandas in-request blocks the server. Move to background task for files > 1 MB.

### Indexing
Add indexes for every column used in `.filter()`, `.order_by()`, or `.get()` with high cardinality.

### Failover / backup
```bash
# Daily backup cron (add to crontab)
0 2 * * * pg_dump nicmah_agrovet | gzip > /backups/agrovet_$(date +%Y%m%d).sql.gz
# Keep 30 days; offload to S3/Backblaze
find /backups -mtime +30 -delete
```

### Load balancing
Not needed until > 100 concurrent users. Gunicorn + nginx handles this project's traffic.
When needed: add multiple Gunicorn workers (`--workers 4`) or scale to 2 app servers behind nginx upstream.

---

## 15. OWASP Top 10 Checklist

| # | Risk | Status | Mitigation |
|---|------|--------|------------|
| A01 | Broken Access Control | ✅ | Role-based permissions (IsAdmin, IsManagerOrAbove, IsCashierOrAbove) |
| A02 | Cryptographic Failures | ✅ | HTTPS enforced; passwords hashed with Django's PBKDF2; JWTs signed |
| A03 | Injection | ✅ | Django ORM prevents SQL injection; DRF serializers validate inputs |
| A04 | Insecure Design | ✅ | select_for_update() on stock; write_only on secrets; generic error messages |
| A05 | Security Misconfiguration | ✅ | DEBUG=False in prod; security headers set; SECRET_KEY fails loudly |
| A06 | Vulnerable Components | ✅ | Dependencies pinned to exact versions; audit with pip-audit / npm audit |
| A07 | Auth Failures | ✅ | Rate limiting on login/PIN; BLACKLIST_AFTER_ROTATION=True; token refresh |
| A08 | Software & Data Integrity | ✅ | Webhook secret-token URL verification for M-Pesa callbacks |
| A09 | Logging Failures | ✅ | Structured JSON logging with request_id; rotating file handler |
| A10 | SSRF | ⚠️ | M-Pesa STK push calls Safaricom API — validate MPESA_CALLBACK_URL is HTTPS |

---

## 16. Production Go-Live Checklist

### Backend
- [ ] `SECRET_KEY` set to a long random value (not the dev placeholder)
- [ ] `DEBUG = False`
- [ ] `ALLOWED_HOSTS` set to actual domain(s)
- [ ] `CORS_ALLOWED_ORIGINS` set to production frontend URL
- [ ] Database is PostgreSQL (not SQLite)
- [ ] All migrations applied: `python manage.py migrate`
- [ ] `python manage.py check --deploy` reports 0 issues
- [ ] Static files collected: `python manage.py collectstatic`
- [ ] `MPESA_CALLBACK_SECRET` set to a random token
- [ ] `MPESA_CALLBACK_URL` updated to production URL including secret
- [ ] Email credentials configured (use App Passwords, not real passwords)
- [ ] `logs/` directory writable by the app process

### nginx
- [ ] `server_name` set to actual domain
- [ ] SSL certificate installed and HTTPS redirect active
- [ ] Security headers verified with `curl -sI https://yourdomain.com`
- [ ] Rate limiting zones active
- [ ] `client_max_body_size` appropriate (10M)

### Frontend
- [ ] `VITE_API_URL` set to production API URL
- [ ] `VITE_WHATSAPP_PHONE` set to production phone number
- [ ] `npm run build` succeeds with no warnings
- [ ] No `console.log` statements in production build
- [ ] Error messages shown to users are generic (no internal details)

### General
- [ ] `.env` is not committed to git (check `.gitignore`)
- [ ] Database backups scheduled
- [ ] Monitor disk space for logs and media uploads
- [ ] Test M-Pesa callback end-to-end with sandbox before going live
- [ ] Run `npm audit` and `pip-audit` — resolve HIGH/CRITICAL findings
