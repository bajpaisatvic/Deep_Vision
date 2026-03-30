# Deep Vision — Docker Architecture & Deployment Guide

## 🏗️ Complete Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                         External Network                              │
│                      (HTTP/HTTPS Traffic)                             │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              Port 3000                  Port 8000
                    │                         │
        ┌───────────▼──────────┐   ┌────────▼─────────────┐
        │  Dashboard (Nginx)   │   │   Backend (Django)   │
        │  ├─ React SPA        │   │   ├─ REST API        │
        │  └─ Static Assets    │   │   ├─ Face Recognition│
        │  Port: 3000          │   │   └─ Admin Panel     │
        │                      │   │   Port: 8000         │
        └──────────┬───────────┘   └─────────┬────────────┘
                   │                         │
                   └────────────┬────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
      ┌─────▼──────┐    ┌──────▼────────┐   ┌─────▼─────────┐
      │   Redis    │    │  PostgreSQL   │   │  Real-time    │
      │   (Cache)  │    │  (Database)   │   │  (Node.js)    │
      │ Port: 6379 │    │ Port: 5432    │   │ Port: 4000    │
      └────────────┘    └───────────────┘   └───────────────┘
                            │
                ┌───────────┬┘
                │           │
        ┌───────▼──────┐  ┌─▼────────────┐
        │ Celery Worker│  │ Celery Beat  │
        │ (Background  │  │ (Scheduler)  │
        │  Tasks)      │  │              │
        └──────────────┘  └──────────────┘
```

## 📋 Service Communication

```
Frontend ──REST API──> Backend ──> Database (PostgreSQL)
  │                       │
  │                       └─> Cache (Redis)
  │
  └─> Real-time Server ──> WebSocket Alerts
                             Broadcast
```

## 🔄 Data Flow

### User Registration/Login
```
React Frontend
    │
    ├─ POST /api/auth/register
    │
    └─> Django Backend
        ├─ Hash password
        ├─ Store in PostgreSQL
        └─ Return JWT token
```

### Face Recognition Pipeline
```
Camera Feed
    │
    └─> Backend Management Command
        ├─ Capture frame
        ├─ Detect faces (OpenCV)
        ├─ Generate embeddings (face_recognition)
        │
        └─> Celery Worker
            ├─ Compare with stored embeddings
            ├─ Calculate distance
            ├─ Redis cache results
            │
            └─ Match Found?
                ├─ YES → Create Alert
                │        ├─ Store in PostgreSQL
                │        ├─ Broadcast via Real-time
                │        └─ Notify via Socket.IO
                │
                └─ NO  → Log & Continue
```

### Real-time Alert Broadcasting
```
Alert Created in Backend
    │
    └─> POST /api/push-alert → Real-time Server
        │
        └─> Socket.IO Broadcast
            │
            ├─> Admin Room → All admins
            ├─> Police Room → Assigned officers
            └─> Citizen Room → Relevant citizens
```

## 🐳 Container Configuration Details

### Backend Container (Django + Gunicorn)
- **Base Image**: python:3.11-slim (350MB)
- **Dependencies**: face_recognition, opencv, celery, etc.
- **Process**: Gunicorn (4 workers)
- **Health Check**: API health endpoint
- **Startup**: Migrations + static files + Gunicorn

### Real-time Container (Node.js + Express + Socket.IO)
- **Base Image**: node:18-alpine (200MB)
- **Dependencies**: express, socket.io, cors
- **Process**: Node.js server
- **Health Check**: HTTP endpoint check
- **Startup**: Direct node server.js

### Dashboard Container (React + Nginx)
- **Build Stage**: node:18-alpine (builds React SPA)
- **Runtime Stage**: nginx:alpine (serves static files)
- **SPA Routing**: All routes fallback to index.html
- **Caching**: Static assets cached with 1-year expiry
- **Security Headers**: CORS, XSS, Clickjacking protection

### Database Container (PostgreSQL)
- **Image**: postgres:15-alpine
- **Volume**: `postgres_data` (persistent storage)
- **Health Check**: pg_isready command

### Cache Container (Redis)
- **Image**: redis:7-alpine
- **Volume**: `redis_data` (persistent storage)
- **Persistence**: AOF (Append-Only File) enabled
- **Health Check**: redis-cli PING command

### Celery Workers
- **Background Tasks**: Face embedding generation, notifications
- **Concurrency**: 4 worker processes
- **Time Limits**: 5 minutes hard limit, 4.67 min soft limit
- **Monitoring**: Celery Flower (optional)

## 🚀 Deployment Strategies

### Strategy 1: Docker Compose (Development/Small Production)
**Best for**: Teams with <50M records, low traffic
```bash
docker-compose -f docker-compose.yml up -d
```
Pros:
- Simple deployment
- All containers on one machine
- Easy local testing

Cons:
- Single point of failure
- Limited scalability
- Can't distribute containers

### Strategy 2: Docker Swarm (Medium Production)
**Best for**: Teams with 50M-1B records, medium traffic
```bash
docker swarm init
docker stack deploy -c docker-compose.yml deep-vision
```
Pros:
- Built-in clustering
- Service replication
- Simple compared to Kubernetes
- No external dependencies

Cons:
- Less features than Kubernetes
- Limited autoscaling

### Strategy 3: Kubernetes (Enterprise)
**Best for**: Large teams, high traffic, 1B+ records
```bash
kubectl apply -f k8s-manifests.yml
```
Pros:
- Industry standard
- Extensive ecosystem
- Auto-scaling & self-healing
- Rolling updates

Cons:
- Complex to learn
- Requires significant ops knowledge
- Overkill for small apps

### Strategy 4: Cloud-Managed (AWS/GCP/Azure)
**Best for**: Minimal ops overhead
- AWS ECS: Fargate containers
- Google Cloud: Cloud Run / GKE
- Azure: Container Instances / AKS

## 📦 Environment-Specific Configurations

### Development
```env
DEBUG=True
PYTHONUNBUFFERED=1
DATABASES: SQLite (local) or Docker Postgres
STATIC_FILES: collectstatic disabled
```

### Staging
```env
DEBUG=False
DATABASES: Cloud RDS
CACHE: Cloud ElastiCache
EMAIL: SendGrid / AWS SES
BACKUP: Daily snapshots
```

### Production
```env
DEBUG=False
SECRET_KEY: 64+ random characters
ALLOWED_HOSTS: Your domain only
DATABASES: Managed RDS with Multi-AZ
CACHE: Managed ElastiCache
SSL/TLS: Let's Encrypt / AWS SSL
MONITORING: CloudWatch / DataDog
LOGGING: Centralized (CloudWatch, Splunk)
BACKUP: Continuous replication
```

## 🔐 Security Best Practices

### Container Security
```dockerfile
# Use specific version (not 'latest')
FROM python:3.11-slim

# Use non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Don't use privileged mode
# docker run --rm ... (never --privileged)

# Use read-only filesystem where possible
# docker run --read-only ...

# Scan images for vulnerabilities
# docker scan deep-vision-backend:latest
```

### Secrets Management
```yaml
# ❌ Don't hardcode secrets
DATABASE_PASSWORD: deepvision_password

# ✅ Use environment variables from secure source
DATABASE_PASSWORD: ${DB_PASSWORD_SECRET}
```

**Production Secret Management:**
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Docker Secrets (Docker Swarm)

### Network Security
```yaml
# Isolate containers on private network
networks:
  backend:
    driver: bridge
  frontend:
    driver: bridge

# Only expose necessary ports
services:
  backend:
    expose: [8000]  # Internal only
    ports: []       # No external exposure (use reverse proxy)
```

## 📊 Monitoring & Logging

### Monitoring Stack (Optional)
```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    # Scrape metrics from services
  
  grafana:
    image: grafana/grafana:latest
    # Visualize metrics
  
  alertmanager:
    image: prom/alertmanager:latest
    # Alert on issues
```

### Logging Stack (Optional)
```yaml
services:
  elasticsearch:
    # Store logs
  
  logstash:
    # Process logs
  
  kibana:
    # Visualize logs
```

## 🎯 Performance Optimization

### Image Size Reduction
| Stage | Size |
|-------|------|
| python:3.11 | 1GB |
| python:3.11-slim | 125MB |
| Multi-stage build | 150MB |
| With alpine | 75MB |

### Build Caching
```dockerfile
# Layer ordering (slow to fast changes)
RUN apt-get update && apt-get install ...
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .  # Source code changes often; keep last
```

### Runtime Performance
- Gunicorn workers tuned for hardware
- Redis connection pooling
- Database query optimization
- CDN for static assets
- Nginx gzip compression

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] All images scanned for vulnerabilities
- [ ] Secrets in secure manager (not .env)
- [ ] Docker image built and pushed to registry
- [ ] Health checks configured
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place

### Deployment
- [ ] Environment variables set correctly
- [ ] Database migrations tested in staging
- [ ] SSL/TLS certificates valid
- [ ] DNS records updated
- [ ] Load balancer configured
- [ ] Auto-scaling policies set
- [ ] Rollback plan documented

### Post-Deployment
- [ ] Monitor logs for errors
- [ ] Check all services are healthy
- [ ] Verify external communications
- [ ] Test critical workflows
- [ ] Performance metrics baseline
- [ ] Alert system tested

## 📚 References

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Django + Docker Guide](https://docs.docker.com/language/python/)
- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [12 Factor App Methodology](https://12factor.net/)
