# Deep Vision — AI-Powered Missing Person Detection

> Final Year Project — Real-time CCTV surveillance with facial recognition for identifying missing persons.

## 🏗️ Architecture

```
┌──────────────┐     REST API      ┌──────────────┐    Socket.IO     ┌───────────────┐
│   React UI   │ ◄────────────────► │ Django API   │ ──────────────► │  Node.js RT   │
│   (Vite)     │     :3000          │ (DRF + CV)   │   Push alerts   │  (Express)    │
│              │ ◄──── MJPEG ────── │    :8000      │                 │    :4000      │
└──────────────┘                    └──────┬───────┘                 └───────────────┘
                                          │
                                    ┌─────▼──────┐
                                    │  Celery     │
                                    │  Worker     │
                                    │  (Redis)    │
                                    └─────┬──────┘
                                          │
                                   ┌──────▼──────┐
                                   │ PostgreSQL   │
                                   └─────────────┘
```

## 📋 Prerequisites

| Tool | Version | Install Guide |
|------|---------|---------------|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| PostgreSQL | 14+ | [postgresql.org](https://postgresql.org) |
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) — for running Redis |
| CMake | Latest | `pip install cmake` (needed for dlib/face_recognition) |
| Visual Studio Build Tools | Latest | [VS Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — select "Desktop C++" workload |

> **⚠️ Important for Windows:** `face_recognition` requires `dlib` which needs C++ build tools and CMake. Install Visual Studio Build Tools with the "Desktop development with C++" workload BEFORE running `pip install`.

---

## 🚀 Setup Guide

### Step 1: Clone & Navigate

```bash
git clone <your-repo-url>
cd Deep_Vision
```

### Step 2: Redis via Docker

Start Redis using Docker (keep this running throughout development):

```bash
docker run -d --name deep-vision-redis -p 6379:6379 redis:7-alpine
```

To check if Redis is running:

```bash
docker ps
```

> **Note:** After restarting your PC, start Redis again with: `docker start deep-vision-redis`

### Step 3: PostgreSQL Database

Open pgAdmin or psql and run:

```sql
CREATE DATABASE deep_vision;
CREATE USER deepvision_user WITH PASSWORD 'your_password';
ALTER ROLE deepvision_user SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE deep_vision TO deepvision_user;
```

### Step 4: Environment File

Copy `.env.example` to `.env` and update values:

```bash
copy .env.example .env
```

Edit `.env`:

```env
# Django
SECRET_KEY=generate-a-random-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database — update user/pass to match Step 2
DATABASE_URL=postgres://deepvision_user:your_password@localhost:5432/deep_vision

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0

# Node.js Real-time
NODE_SERVICE_URL=http://localhost:4000

# Vision Pipeline
FACE_MATCH_THRESHOLD=0.6
CCTV_FRAME_RATE=1
```

### Step 5: Python Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install cmake
pip install dlib
pip install -r requirements.txt
```

> If `dlib` fails, ensure Visual Studio Build Tools with C++ workload is installed, then retry.

### Step 6: Database Migrations

```bash
python manage.py migrate
```

### Step 7: Create Superuser

```bash
python manage.py createsuperuser
```

Use role `ADMIN` when prompted (or update via Django admin later).

### Step 8: Node.js Real-time Server

```bash
cd deepvision-realtime
npm install
cd ..
```

### Step 9: React Dashboard

```bash
cd deepvision-dashboard
npm install
cd ..
```

---

## ▶️ Running the Project

You need **5 terminals** running simultaneously:

### Terminal 0 — Redis (Docker)

Make sure Redis is running:

```bash
docker start deep-vision-redis
```

### Terminal 1 — Django API Server

```bash
cd Deep_Vision
venv\Scripts\activate
python manage.py runserver
```
→ Runs on `http://127.0.0.1:8000`

### Terminal 2 — Celery Worker

```bash
cd Deep_Vision
venv\Scripts\activate
celery -A config worker --loglevel=info --pool=solo
```
→ `--pool=solo` is required on Windows

### Terminal 3 — Node.js Real-time Server

```bash
cd Deep_Vision\deepvision-realtime
node server.js
```
→ Runs on `http://localhost:4000`

### Terminal 4 — React Dashboard

```bash
cd Deep_Vision\deepvision-dashboard
npm run dev
```
→ Runs on `http://localhost:3000` (or whichever port Vite assigns)

---

## 🧪 Testing the Full Flow

### 1. Create Users

Via API or Django admin (`http://127.0.0.1:8000/admin/`):

| Username | Role | Purpose |
|----------|------|---------|
| citizen1 | CITIZEN | Reports missing person |
| officer1 | POLICE | Monitors alerts |
| admin1 | ADMIN | Full access |

### 2. Report a Missing Person

1. Login as `citizen1` on the React dashboard
2. Go to **Report Missing** → fill name, age, gender, description
3. Upload a **clear face photo** (frontal, well-lit, one person)
4. Submit → case is created

### 3. Verify Embedding Generated

Check the Celery terminal — you should see:

```
✅ Embedding generated for MissingPersonImage #1 (128-d vector).
```

If you see `⚠️ No face detected`, the photo quality is poor — re-upload.

### 4. Start Live Monitoring

1. Login as `officer1` or `admin1`
2. Go to **Live Monitor** in sidebar
3. Click **Start** on the webcam feed
4. Show the same face (from the uploaded photo) to the webcam

### 5. Wait for Detection

- Background thread captures frames every 3 seconds
- Every 20 seconds, sends a batch to Celery for matching
- Watch the Celery terminal for match logs:

```
🔍 Matching against 1 stored embedding(s), threshold=0.60
📏 Case #1, Image #1 — distance: 0.42 — ✅ MATCH
🚨 Alert #1 — Person #1 on Webcam — Confidence: 58.0%
```

### 6. Alert Notification

- A **toast notification** appears on the dashboard
- Go to **Alerts** → see the new alert with snapshot
- Click to see full details with confidence score

### 7. Verify Alert

- Click **Verify Match** → case status changes to FOUND
- That person's embeddings are excluded from future searches

---

## 📁 Project Structure

```
Deep_Vision/
├── accounts/          # User auth, JWT, roles (CITIZEN/POLICE/ADMIN)
├── alerts/            # Detection alerts, notifications, verification
├── cameras/           # CCTV camera management, MJPEG streaming
├── cases/             # Missing person cases, image uploads
├── config/            # Django settings, URLs, Celery config
├── vision/            # Face recognition pipeline, Celery tasks
├── media/             # Uploaded images, captured frames, snapshots
├── deepvision-dashboard/   # React frontend (Vite)
├── deepvision-realtime/    # Node.js Socket.IO server
├── requirements.txt
├── .env
└── manage.py
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `dlib` won't install | Install Visual Studio Build Tools with C++ workload + CMake |
| `celery` command not found | Use `venv\Scripts\celery` or activate venv first |
| Celery `PermissionError` on Windows | Use `--pool=solo` flag |
| No face detected in uploaded photo | Use a clear, frontal face photo with good lighting |
| Threshold too strict (no matches) | Lower `FACE_MATCH_THRESHOLD` in `.env` (try 0.55–0.65) |
| Webcam `camera_id=0` error | Run migration: `python manage.py migrate` |
| CORS errors from React | Ensure `127.0.0.1:3000` is in `CORS_ALLOWED_ORIGINS` |
| Node.js connection refused | Make sure Node server is running on port 4000 |

---

## 🔑 API Endpoints Quick Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register/` | No | Register user |
| POST | `/api/auth/login/` | No | Login → get JWT |
| POST | `/api/auth/token/refresh/` | No | Refresh JWT |
| GET | `/api/cases/` | JWT | List cases |
| POST | `/api/cases/` | JWT | Create case |
| GET | `/api/cases/<id>/` | JWT | Case detail |
| POST | `/api/cases/<id>/images/` | JWT | Upload face image |
| PATCH | `/api/cases/<id>/status/` | JWT (Police/Admin) | Update status |
| GET | `/api/alerts/` | JWT (Police/Admin) | List alerts |
| GET | `/api/alerts/<id>/` | JWT (Police/Admin) | Alert detail |
| PATCH | `/api/alerts/<id>/verify/` | JWT (Police/Admin) | Verify/dismiss |
| GET | `/api/cameras/` | JWT | List cameras |
| GET | `/api/cameras/<id>/stream/` | No | MJPEG stream |
| POST | `/api/cameras/<id>/stop/` | No | Stop stream |
| POST | `/api/cameras/simulate/` | JWT | One-shot detection |
| GET | `/api/notifications/` | JWT | Officer notifications |
| GET | `/api/health/` | No | Health check |
