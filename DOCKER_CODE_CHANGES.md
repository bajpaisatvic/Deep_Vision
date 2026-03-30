# Deep Vision — Code Adjustments for Docker

## Overview
Your code is mostly Docker-ready! This file documents the **minimal changes** recommended to fully optimize for containerization.

---

## 1. ✅ Django Backend — Already Docker-Ready

### What works automatically:
- Environment variable configuration via `decouple`
- Celery uses `CELERY_BROKER_URL` from environment
- Database connection via `DATABASE_URL` from environment
- MultiStage build handles dlib/face_recognition compilation

### Optional Improvements:

#### A. Add Health Check Endpoint (Recommended)
Create file: `config/urls.py` — add this route:
```python
# config/urls.py
from django.http import JsonResponse

def health_check(request):
    """Used by Docker health checks"""
    return JsonResponse({'status': 'ok'}, status=200)

urlpatterns = [
    path('api/health/', health_check),
    # ... rest of urls
]
```

#### B. Add ALLOWED_HOSTS Configuration
Your `config/settings/base.py` already handles this via decouple:
```python
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())
# This is already good! Set in .env: ALLOWED_HOSTS=localhost,127.0.0.1,backend,0.0.0.0
```

#### C. Configure Static Files for Production
Already have:
```python
# settings/base.py
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
```

The Dockerfile runs: `python manage.py collectstatic --noinput` ✓

---

## 2. 📱 Real-time Server — Small Changes Needed

### Current Status
Your `deepvision-realtime/server.js` has hardcoded CORS origins.

### Change: Make CORS Origins Configurable

**File:** `deepvision-realtime/server.js`

**Current (lines ~20-25):**
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

// ... Socket.IO config ...
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

**Change to:**
```javascript
const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
}));

// ... Socket.IO config ...
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

**In docker-compose.yml, the environment variable is already set:**
```yaml
realtime:
  environment:
    - CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://dashboard:3000
```

✓ **Status:** Optional but recommended for production flexibility

---

## 3. ⚛️ React Dashboard — No Changes Needed

### Current Status
✓ Already works with Docker via Vite
✓ Build process is standard (`npm run build`)

### What works:
- `package.json` specifies all dependencies
- Vite config is standard
- nginx.conf handles SPA routing correctly

---

## 4. 🔄 Environment Variables — Already Configured

### Django reads from environment:
```python
from decouple import config
DEBUG = config('DEBUG', default=False, cast=bool)
SECRET_KEY = config('SECRET_KEY')
DATABASE_URL = config('DATABASE_URL')
REDIS_URL = config('REDIS_URL')
```

✓ All already handled in `.env.docker.example`

### Node.js reads from environment:
```javascript
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
```

✓ Dockerfile.realtime sets these automatically

---

## 5. 🗄️ Database Migrations — Automatic

The Dockerfile.backend automatically runs:
```bash
python manage.py migrate
```

This happens on every container start, so the DB is always up-to-date. ✓

---

## 6. 📦 Requirements Files — Already Good

Your `requirements.txt` is well-structured:
- Specific versions pinned
- All CLI tools included (gunicorn, pytest, etc.)
- Face recognition and OpenCV included

✓ No changes needed

---

## 7. 🛡️ Optional Security Enhancements

### A. Add Django Security Middleware (Recommended for Production)
**File:** `config/settings/production.py`

```python
# Security Headers
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Prevent MIME sniffing
SECURE_CONTENT_SECURITY_POLICY = {
    'default-src': ("'self'",),
    'script-src': ("'self'", "'unsafe-inline'"),  # Add more sources as needed
}
```

### B. Add Request Logging (Recommended)
**File:** `config/settings/base.py`

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'stdout': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['stdout'],
        'level': 'INFO',
    },
}
```

---

## 8. 🔧 Optional Celery Task Monitoring

### Add Flower (Web UI for Celery)
**File:** `docker-compose.yml` — Add service:

```yaml
flower:
  build:
    context: .
    dockerfile: Dockerfile.celery
  container_name: deep-vision-flower
  command: celery -A config.celery_app flower --port=5555
  environment:
    - CELERY_BROKER_URL=redis://redis:6379/0
  ports:
    - "5555:5555"
  depends_on:
    - redis
    - celery
  networks:
    - deep-vision-network
```

Then access at `http://localhost:5555`

---

## Summary Table

| Component | Status | Action |
|-----------|--------|--------|
| Django Backend | ✅ Ready | Optional: Add health endpoint |
| Celery Workers | ✅ Ready | Optional: Add Flower monitoring |
| Real-time Server | ⚠️ Almost | Recommended: Use env vars for CORS |
| React Dashboard | ✅ Ready | No changes |
| PostgreSQL | ✅ Ready | No changes |
| Redis | ✅ Ready | No changes |
| Environment Config | ✅ Ready | Just copy `.env.docker.example` → `.env` |

---

## Testing the Setup

After running `docker-compose up`:

### 1. Test Backend
```bash
# Should return health status
curl http://localhost:8000/api/health/

# Should return Django admin
curl http://localhost:8000/admin
```

### 2. Test Frontend
```bash
# Should load React app
curl http://localhost:3000
```

### 3. Test Real-time Server
```bash
# Should return response (not 404)
curl http://localhost:4000

# Test from browser console:
# const socket = io('http://localhost:4000');
# socket.on('connect', () => console.log('Connected!'));
```

### 4. Test Database
```bash
docker-compose exec postgres psql -U deepvision_user -d deep_vision -c "SELECT 1;"
```

### 5. Test Redis
```bash
docker-compose exec redis redis-cli PING
```

---

## Checklist Before Production

- [ ] Updated all hardcoded `localhost` references to use environment variables
- [ ] Set `DEBUG=False` in production `.env`
- [ ] Generated strong `SECRET_KEY` (use: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- [ ] Configured HTTPS/SSL certificates
- [ ] Updated `ALLOWED_HOSTS` to your actual domain
- [ ] Tested all critical API endpoints
- [ ] Tested real-time WebSocket connections
- [ ] Verified database backups are working
- [ ] Configured centralized logging
- [ ] Set up monitoring and alerting
- [ ] Documented deployment procedure

---

## Advanced Topics (Optional)

### Multi-stage Builds
Already implemented in all Dockerfiles! ✓

### Non-root User
Already implemented in all Dockerfiles! ✓

### Health Checks
Already implemented in docker-compose.yml! ✓

### Networking
Containers communicate via service names (not localhost). Already configured! ✓

---

**Your setup is nearly production-ready. Make the recommended Real-time Server change and you're all set!**
