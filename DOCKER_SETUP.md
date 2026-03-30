# Deep Vision — Docker Setup & Management Guide

## 🐳 Prerequisites

Before running Docker, ensure you have installed:
- **Docker Desktop** (includes Docker Engine and Docker Compose)
- **Git** (for version control)

### Windows Installation
1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Install and restart your computer
3. Open PowerShell and verify: `docker --version`

---

## 🚀 Quick Start

### Step 1: Clone & Navigate
```bash
cd Deep_Vision
```

### Step 2: Create Environment File
```bash
copy .env.docker.example .env
```

Edit `.env` and update these values:
```env
DEBUG=False
SECRET_KEY=<generate-a-strong-secret-key>
DB_PASSWORD=<use-a-strong-password>
```

### Step 3: Build & Run All Services
```bash
# Development (with hot-reload, debug logging)
docker-compose up --build

# Production (optimized, background)
docker-compose -f docker-compose.yml up -d --build
```

Your services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Real-time Server**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## 📋 Useful Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery
docker-compose logs -f realtime
docker-compose logs -f dashboard
```

### Execute Commands in Containers
```bash
# Django migrations
docker-compose exec backend python manage.py migrate

# Create Django superuser
docker-compose exec backend python manage.py createsuperuser

# Django shell
docker-compose exec backend python manage.py shell

# Run management commands
docker-compose exec backend python manage.py <command>
```

### Database Management
```bash
# PostgreSQL shell
docker-compose exec postgres psql -U deepvision_user -d deep_vision

# Redis CLI
docker-compose exec redis redis-cli
```

### View Container Status
```bash
docker-compose ps
```

### Stop Services
```bash
# Stop all services (data persists)
docker-compose stop

# Stop specific service
docker-compose stop backend

# Stop and remove containers
docker-compose down

# Stop, remove containers, and volumes
docker-compose down -v
```

### Rebuild Containers
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild without cache
docker-compose build --no-cache
```

---

## 🔧 Development Workflow

The `docker-compose.override.yml` file provides development-specific settings:

```bash
# Run with development overrides (enabled by default)
docker-compose up

# Run production (without overrides)
docker-compose -f docker-compose.yml up
```

### Development Features (via override):
- Hot-reload enabled for code changes
- Debug mode (DEBUG=True)
- Python development server instead of Gunicorn
- Vite dev server for React (instead of production Nginx build)
- Verbose logging
- Volume mounts for live code editing

---

## 📦 Service Overview

| Service | Port | Purpose | Image |
|---------|------|---------|-------|
| **backend** | 8000 | Django REST API | Python 3.11 |
| **celery** | — | Background task runner | Python 3.11 |
| **celery-beat** | — | Task scheduler | Python 3.11 |
| **realtime** | 4000 | Node.js WebSocket server | Node.js 18 |
| **dashboard** | 3000 | React frontend | Nginx |
| **postgres** | 5432 | PostgreSQL database | PostgreSQL 15 |
| **redis** | 6379 | Cache & message broker | Redis 7 |

---

## 🔐 Security Checklist (Before Production)

- [ ] Change `SECRET_KEY` in `.env` to a strong random value
- [ ] Set `DEBUG=False`
- [ ] Update `DB_PASSWORD` to a strong password
- [ ] Update `ALLOWED_HOSTS` to your actual domain
- [ ] Set up HTTPS/SSL (use Nginx reverse proxy or Let's Encrypt)
- [ ] Use external database (AWS RDS, Google Cloud SQL)
- [ ] Use external Redis (AWS ElastiCache, Redis Labs)
- [ ] Set up proper logging to centralized service
- [ ] Configure email for notifications
- [ ] Implement rate limiting
- [ ] Use secrets management (AWS Secrets Manager, Vault)

---

## 🚨 Troubleshooting

### Containers won't start
```bash
# Check logs
docker-compose logs

# Rebuild without cache
docker-compose build --no-cache
docker-compose up
```

### Port already in use
```bash
# Find process using port 8000
lsof -i :8000

# Or dynamically assign ports in docker-compose.yml:
# ports:
#   - "8001:8000"
```

### Database connection errors
```bash
# Ensure postgres is running and healthy
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Manually run migrations
docker-compose exec backend python manage.py migrate
```

### Redis connection issues
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

### Frontend not loading
```bash
# Clear browser cache (Ctrl+Shift+Del)
# Rebuild dashboard
docker-compose build dashboard
docker-compose restart dashboard
```

---

## 📊 Monitoring & Health Checks

All containers include health checks. View status:
```bash
docker-compose ps

# Output shows health status for each service
# Starting, healthy, unhealthy
```

---

## 🎛️ Advanced Configuration

### Scale Celery Workers
Edit `docker-compose.yml` to add multiple workers:
```yaml
services:
  celery-worker-1:
    # ... existing config ...
  celery-worker-2:
    # ... same config, different name ...
  celery-worker-3:
    # ... same config, different name ...
```

### Use Docker Network for Communication
Services communicate via internal Docker network:
- Backend → Redis: `redis://redis:6379`
- Backend → Postgres: `postgres://postgres:5432`
- Backend → Real-time: `http://realtime:4000`

No localhost references needed; use service names defined in `docker-compose.yml`.

---

## 📝 Dockerfile Details

| Dockerfile | Purpose | Base Image | Size |
|-----------|---------|-----------|------|
| `Dockerfile.backend` | Django API with Gunicorn | python:3.11-slim | ~1.5GB |
| `Dockerfile.realtime` | Node.js WebSocket server | node:18-alpine | ~200MB |
| `Dockerfile.dashboard` | React SPA served by Nginx | nginx:alpine | ~100MB |
| `Dockerfile.celery` | Background task worker | python:3.11-slim | ~1.5GB |

All use **multi-stage builds** to minimize final image sizes.

---

## 🌐 Deployment

For cloud deployment:

### Docker Hub
```bash
# Build and push to Docker Hub
docker login
docker build -f Dockerfile.backend -t yourusername/deep-vision-backend:v1.0 .
docker push yourusername/deep-vision-backend:v1.0
```

### AWS ECS / Kubernetes
- Use docker-compose as reference for service definitions
- Map ports and environment variables appropriately
- Use managed database (RDS) instead of containerized Postgres
- Use managed cache (ElastiCache) instead of containerized Redis

### Heroku, Railway, Render
Deploy individual services or use the docker-compose.yml as reference.

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Django + Docker Guide](https://docs.docker.com/language/python/build-images/)
- [Node.js + Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
