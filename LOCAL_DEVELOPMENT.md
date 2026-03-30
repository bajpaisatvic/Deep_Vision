# 🐳 Deep Vision — Local Development with Docker

## Quick Start

```bash
# 1. Install Docker Desktop from docker.com
# 2. Navigate to project
cd Deep_Vision

# 3. Copy environment file
copy .env.docker.example .env

# 4. Start everything
docker-compose up

# 5. In another terminal, create admin user (first time only)
docker-compose exec backend python manage.py createsuperuser
```

**Done!** Access your services:
- **Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin
- **Real-time**: http://localhost:4000

---

## Services

| Service | Port | Tech |
|---------|------|------|
| Dashboard | 3000 | React + Vite |
| Backend | 8000 | Django |
| Real-time | 4000 | Node.js |
| Database | 5432 | PostgreSQL |
| Cache | 6379 | Redis |
| Workers | — | Celery |

---

## Common Commands

```bash
# View logs (all services)
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f celery
docker-compose logs -f realtime

# Run migrations
docker-compose exec backend python manage.py migrate

# Create admin user
docker-compose exec backend python manage.py createsuperuser

# Django shell
docker-compose exec backend python manage.py shell

# Database shell
docker-compose exec postgres psql -U deepvision_user -d deep_vision

# Redis CLI
docker-compose exec redis redis-cli

# Stop everything (data persists)
docker-compose stop

# Full cleanup (removes containers and volumes)
docker-compose down -v
```

---

## Development Workflow

1. **Edit code** — Changes auto-reload via volume mounts
2. **Check logs** — `docker-compose logs -f backend`
3. **Test APIs** — http://localhost:8000/api
4. **View frontend** — http://localhost:3000

---

## Troubleshooting

**Port already in use?** Edit `docker-compose.yml`:
```yaml
backend:
  ports:
    - "8001:8000"  # Use 8001 instead
```

**Database errors?** Full rebuild:
```bash
docker-compose down -v
docker-compose up
```

**Out of memory?**
- Docker Desktop → Settings → Resources → Increase memory to 4GB+

**Services won't start?**
```bash
docker-compose build --no-cache
docker-compose up
```

---

## That's it! 🚀

Just run `docker-compose up` and everything works locally. Happy coding!
