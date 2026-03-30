# 🐳 Deep Vision — Local Development with Docker

## Quick Start (5 Minutes)

### Step 1: Install Docker
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Step 2: Setup Environment
```bash
cd Deep_Vision
copy .env.docker.example .env
```

### Step 3: Start Everything
```bash
docker-compose up
```

That's it! All services will start automatically.

### Step 4: Access Services
- **Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin
- **Real-time**: http://localhost:4000

### Step 5: Create Admin User (First Time Only)
```bash
# Open a new terminal while docker-compose is running:
docker-compose exec backend python manage.py createsuperuser
```

---

## Services Running

| Service | Port | Technology |
|---------|------|-----------|
| Dashboard | 3000 | React + Vite |
| Backend | 8000 | Django Dev Server |
| Real-time | 4000 | Node.js |
| Database | 5432 | PostgreSQL |
| Cache | 6379 | Redis |
| Workers | — | Celery |

---

## Common Commands

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery
docker-compose logs -f realtime
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Django shell
docker-compose exec backend python manage.py shell

# Database shell
docker-compose exec postgres psql -U deepvision_user -d deep_vision
```

### Redis
```bash
docker-compose exec redis redis-cli
```

### Stop Everything
```bash
docker-compose down
```

### Full Cleanup (Remove Volumes)
```bash
docker-compose down -v
```

---

## Development Workflow

1. **Edit your code** — Changes auto-reload due to volume mounts
2. **Check logs** — Use `docker-compose logs -f backend` to see errors
3. **Run migrations** — `docker-compose exec backend python manage.py migrate`
4. **Test APIs** — Access http://localhost:8000/api
5. **View frontend** — Access http://localhost:3000

---

## Troubleshooting

### Port already in use
Edit `docker-compose.yml` and change the port:
```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Use 8001 instead of 8000
```

### Database errors
```bash
# Rebuild fresh
docker-compose down -v
docker-compose up
```

### Frontend not loading
```bash
# Rebuild dashboard
docker-compose build dashboard
docker-compose up dashboard
```

### Out of memory
Docker Desktop → Settings → Resources → Increase memory to 4GB+

---

## That's All!

Just run `docker-compose up` and everything will work locally. Happy coding! 🚀

