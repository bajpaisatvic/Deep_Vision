# 🔍 Deep Vision — AI-Powered Missing Person Detection System

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-4.x-092E20?style=flat-square&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-5-37814A?style=flat-square&logo=celery&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-4.x-5C3EE8?style=flat-square&logo=opencv&logoColor=white)

> Real-time face recognition across live CCTV streams using a distributed, 3-service architecture. Built to scale CV-heavy workloads without blocking the API layer.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│              React Dashboard  ←→  Socket.IO (real-time alerts)  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API / WebSocket
┌───────────────────────────▼─────────────────────────────────────┐
│                  SERVICE 1: Django API Server                    │
│  • JWT Auth (access + refresh rotation)                          │
│  • 15+ REST endpoints across 6 Django apps                       │
│  • MJPEG camera stream ingestion                                 │
│  • Role-based access: Citizen / Police / Admin                   │
│  • Case lifecycle management                                     │
└──────────┬────────────────────────────────────────┬─────────────┘
           │ Enqueue frames via Redis                │
┌──────────▼─────────────┐              ┌────────────▼────────────┐
│  SERVICE 2: Celery      │              │  SERVICE 3: Node.js     │
│  Worker Pool (async)    │              │  Socket.IO Server       │
│                         │              │                         │
│  • Batch frames (20s)   │              │  • Real-time alert      │
│  • dlib 128-d face      │              │    push to officers     │
│    embedding extraction │              │  • Sub-second delivery  │
│  • Configurable match   │◄─ alerts ───►│  • Room-based channels  │
│    distance threshold   │              │    per police station   │
│  • Emit match events    │              │                         │
└─────────────────────────┘              └─────────────────────────┘
           │
┌──────────▼─────────────┐
│      PostgreSQL         │
│  • Missing persons DB   │
│  • Face embedding store │
│  • Case + alert logs    │
└─────────────────────────┘
```

**Why 3 services?** Face recognition via dlib is CPU-intensive. Running it synchronously would block the Django request cycle under concurrent CCTV loads. The Celery worker pool decouples compute from the API, while the Node.js Socket.IO service handles real-time push without long-polling overhead on Django.

---

## ✨ Key Features

| Feature | Details |
|---|---|
| **Real-time face matching** | dlib 128-dimensional embeddings with configurable distance thresholds |
| **Async pipeline** | Frames batched every 20s → Redis queue → Celery workers (no API blocking) |
| **Live CCTV streaming** | Full MJPEG camera stream ingestion and processing |
| **Sub-second alerts** | Socket.IO push to police officers the moment a match is confirmed |
| **Role-based multi-tenancy** | Citizen / Police / Admin with JWT refresh-token rotation |
| **Case management** | Full case lifecycle: register → investigate → resolve |
| **Alert verification** | Officers confirm/reject matches before escalation |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **API Server** | Django 4, Django REST Framework |
| **CV Engine** | OpenCV 4, dlib (128-d face embeddings) |
| **Async Workers** | Celery 5 + Redis (task queue & frame store) |
| **Real-time** | Node.js + Socket.IO |
| **Frontend** | React 18 |
| **Database** | PostgreSQL 15 |
| **Auth** | JWT with refresh-token rotation |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- `cmake` (required for dlib compilation)

### 1. Clone the repository

```bash
git clone https://github.com/bajpaisatvic/Deep_Vision.git
cd Deep_Vision
```

### 2. Set up the Django API server

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env: DATABASE_URL, REDIS_URL, SECRET_KEY, JWT_SECRET

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start Django server
python manage.py runserver
```

### 3. Start Celery workers

```bash
# In a new terminal (venv activated)
celery -A config worker --loglevel=info --concurrency=4
```

### 4. Start the Node.js Socket.IO server

```bash
cd deepvision-realtime
npm install
node index.js
```

### 5. Start the React dashboard

```bash
cd deepvision-dashboard
npm install
npm run dev
```

---

## 📁 Project Structure

```
Deep_Vision/
├── accounts/          # User auth: JWT, role management (Citizen/Police/Admin)
├── alerts/            # Alert creation, verification, and escalation logic
├── cameras/           # CCTV feed ingestion, MJPEG stream handling
├── cases/             # Missing person case lifecycle management
├── config/            # Django settings, Celery config, URL routing
├── deepvision-dashboard/  # React frontend
├── deepvision-realtime/   # Node.js + Socket.IO real-time alert server
└── requirements.txt
```

---

## ⚙️ How the Face Recognition Pipeline Works

```
1. Camera feed → Django ingests MJPEG frames
2. Frames queued to Redis every 20 seconds (batching reduces redundant processing)
3. Celery worker dequeues batch → runs dlib face detection → extracts 128-d embeddings
4. Embedding compared against missing persons DB using configurable distance threshold
5. On match → alert event emitted to Node.js Socket.IO server
6. Socket.IO pushes alert to the assigned police station room in < 1 second
7. Officer receives alert with face match confidence, camera location, timestamp
8. Officer verifies or rejects the match → case status updated in PostgreSQL
```

---

## 🔒 Security

- JWT access + refresh token rotation (tokens invalidated on refresh)
- Role-based route guards — Citizens cannot access police/admin endpoints
- Face embeddings stored as float arrays, never as raw images in the alert log
- Camera credentials stored in environment variables, never hardcoded

---

## 📊 API Overview

| Module | Endpoints | Description |
|---|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/refresh` | JWT-based auth |
| Cases | `GET/POST /api/cases/`, `PATCH /api/cases/:id/` | Missing person case CRUD |
| Cameras | `GET /api/cameras/`, `POST /api/cameras/stream/` | Camera registration & streaming |
| Alerts | `GET /api/alerts/`, `PATCH /api/alerts/:id/verify/` | Alert retrieval & verification |
| Admin | `/api/admin/users/`, `/api/admin/stats/` | System stats, user management |

---
