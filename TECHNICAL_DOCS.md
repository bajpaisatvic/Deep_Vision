# Deep Vision — Technical Documentation

## For Viva / Project Presentation

---

## 1. Project Overview

**Deep Vision** is an AI-powered platform that uses facial recognition on CCTV surveillance feeds to automatically identify missing persons and alert law enforcement in near real-time.

### Problem Statement

Over 100,000 missing persons cases are reported in India annually. Traditional methods rely on manual CCTV review which is slow, error-prone, and doesn't scale. Deep Vision automates this process using AI.

### Solution

A cloud-ready web application with three services:

| Service | Technology | Role |
|---------|-----------|------|
| **Backend API** | Django + DRF + Celery | REST API, face recognition pipeline, background processing |
| **Real-time Server** | Node.js + Socket.IO | WebSocket-based instant alert notifications |
| **Frontend Dashboard** | React + Vite | Role-based UI for citizens, police, and admin |

---

## 2. Face Embedding — How It Works

### What is a Face Embedding?

A **face embedding** is a **128-dimensional numerical vector** (a list of 128 floating-point numbers) that uniquely represents a person's face. Two photos of the same person will produce embeddings that are numerically close to each other. Different people produce embeddings that are far apart.

```
Example embedding (first 8 of 128 values):
[-0.0912, 0.1245, 0.0034, -0.0678, 0.1567, -0.0234, 0.0891, -0.1123, ...]
```

### The Embedding Generation Pipeline

```
                 ┌─────────────────┐
                 │  Uploaded Photo  │
                 └────────┬────────┘
                          │
                 ┌────────▼────────┐
         Step 1  │  Load Image     │  face_recognition.load_image_file()
                 │  Convert to RGB │  NumPy array (H × W × 3)
                 └────────┬────────┘
                          │
                 ┌────────▼────────┐
         Step 2  │  Face Detection │  HOG (Histogram of Oriented Gradients)
                 │  Find face box  │  Returns bounding box coordinates
                 └────────┬────────┘
                          │
                 ┌────────▼────────┐
         Step 3  │  Face Alignment │  68-point facial landmark detection
                 │  Normalize pose │  Eyes, nose, mouth positioned consistently
                 └────────┬────────┘
                          │
                 ┌────────▼────────────────┐
         Step 4  │  Deep Neural Network    │  ResNet-based model (dlib)
                 │  Generate 128-d vector  │  Pre-trained on ~3M face images
                 └────────┬────────────────┘
                          │
                 ┌────────▼────────┐
         Step 5  │  Store in DB    │  PostgreSQL JSON field
                 │  As list[float] │  Linked to MissingPersonImage record
                 └─────────────────┘
```

### Step-by-Step Technical Details

#### Step 1: Image Loading
```python
image = face_recognition.load_image_file(image_path)
# Returns: NumPy array of shape (height, width, 3) in RGB format
```

#### Step 2: Face Detection (HOG)
- **HOG** = Histogram of Oriented Gradients
- Divides image into small cells (8×8 pixels)
- Computes gradient direction histograms for each cell
- Slides a detection window across the image
- Uses a **trained SVM classifier** to determine if each window contains a face
- Returns **bounding box coordinates**: `(top, right, bottom, left)`

```python
face_locations = face_recognition.face_locations(image, model='hog')
# Returns: [(top, right, bottom, left), ...]
```

**Why HOG over CNN?**
- HOG is ~5× faster on CPU (important for real-time processing)
- CNN is more accurate but requires GPU
- For our use case (frontal faces in CCTV), HOG is sufficient

#### Step 3: Facial Landmark Detection
- Detects **68 key points** on the face:
  - Jawline (17 points), eyebrows (10), nose (9), eyes (12), mouth (20)
- Used internally by dlib to **align and normalize** the face
- Ensures the face is oriented consistently regardless of head tilt

#### Step 4: Deep Neural Network (ResNet)
- Architecture: **Modified ResNet** (deep residual network) with 29 convolutional layers
- Pre-trained on **~3 million face images** from diverse datasets
- Uses **metric learning** (triplet loss function):
  - Same person → embeddings close together
  - Different people → embeddings far apart
- Output: **128-dimensional float vector**

```python
encodings = face_recognition.face_encodings(image, face_locations)
# Returns: [numpy.array of shape (128,), ...]
```

#### Step 5: Storage
- Embedding stored as a **JSON array** in PostgreSQL
- Linked to the `MissingPersonImage` model
- Celery task runs this asynchronously after photo upload (doesn't block the user)

---

## 3. Face Matching — How Comparison Works

### Distance Calculation (Euclidean Distance)

When a face is detected on a CCTV camera, we compare its embedding against all stored embeddings using **Euclidean distance**:

```
d = √(∑(aᵢ - bᵢ)² for i = 1 to 128)
```

Where:
- `a` = CCTV face embedding (128 values)
- `b` = Stored missing person embedding (128 values)
- `d` = distance (lower = more similar)

### Threshold-Based Matching

```
if distance ≤ THRESHOLD (0.6):
    → MATCH (same person likely)
    → confidence = 1.0 - distance

if distance > THRESHOLD:
    → NO MATCH (different person)
```

| Distance | Interpretation | Action |
|----------|---------------|--------|
| 0.0 – 0.4 | Very strong match (possibly same photo) | Alert with high confidence |
| 0.4 – 0.5 | Strong match | Alert created |
| 0.5 – 0.6 | Probable match | Alert created (needs human review) |
| 0.6 – 0.8 | Unlikely match | No alert |
| 0.8+ | Different person | No alert |

### Example Match

```
Stored embedding (Person "Rahul"):   [-0.091, 0.124, 0.003, -0.067, ...]
CCTV captured face embedding:       [-0.088, 0.130, 0.001, -0.071, ...]
                                      ↓        ↓       ↓       ↓
Differences squared:                [0.000009, 0.000036, 0.000004, 0.000016, ...]
Sum of 128 squared differences:     0.2025
√0.2025 = 0.45 → distance

0.45 < 0.60 (threshold) → ✅ MATCH
confidence = 1.0 - 0.45 = 0.55 (55%)
```

---

## 4. Near Real-Time Detection Pipeline

### Why "Near Real-Time" Instead of "Real-Time"?

True real-time face recognition on every frame at 30 FPS would require a GPU and block the video stream. Our approach **decouples** streaming from recognition:

```
┌──────────────────────────────────────────────────────────────────┐
│                    STREAMING (Uninterrupted)                     │
│  Camera → 15 FPS MJPEG → Browser (user sees smooth video)       │
└──────────────────────────────────────────────────────────────────┘
                            │
              Background Thread (runs alongside stream)
                            │
              ┌─────────────▼──────────────┐
              │  Every 3 seconds:          │
              │  1. Grab a frame           │
              │  2. Run Haar Cascade       │  ← FAST (< 50ms)
              │     (face detection only)  │
              │  3. Face found?            │
              │     → Save frame to disk   │
              └──────────────┬─────────────┘
                             │
              ┌──────────────▼──────────────┐
              │  Every 20 seconds:           │
              │  Send batch to Celery        │  ← All frames at once
              └──────────────┬───────────────┘
                             │
              ┌──────────────▼───────────────────────┐
              │  Celery Worker (separate process):    │
              │  1. Load all frames from disk         │
              │  2. face_recognition (accurate, slow) │  ← HEAVY (~1s/face)
              │  3. Generate 128-d embeddings         │
              │  4. Compare vs stored embeddings      │
              │  5. Best match per person → Alert     │
              │  6. Clean up frame files              │
              └──────────────┬───────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │  On Match:                   │
              │  1. Create DetectionAlert    │
              │  2. Save snapshot image      │
              │  3. Create Notifications     │
              │  4. Push to Node.js server   │
              │     → Socket.IO → Browser   │
              │     → Toast notification 🔔 │
              └─────────────────────────────┘
```

### Two-Stage Face Detection

| Stage | Where | Algorithm | Speed | Purpose |
|-------|-------|-----------|-------|---------|
| **Stage 1** | Background Thread | Haar Cascade | ~30ms | Fast screening — "is there a face?" |
| **Stage 2** | Celery Worker | face_recognition (HOG + ResNet) | ~1000ms | Accurate matching — "whose face?" |

This two-stage approach means:
- The stream never slows down
- Only frames with faces are sent to the heavy processing
- Batch processing reduces Celery task overhead

---

## 5. Alert Lifecycle

```
  PENDING ──► VERIFIED ──► Case → FOUND (stop searching)
     │
     └──────► DISMISSED (false positive, keep searching)
```

1. **PENDING**: Alert created by Celery after match detection
2. **VERIFIED**: Police/Admin confirms the match is correct
   - Case status automatically changes to `FOUND`
   - That person's embeddings are **excluded from all future searches**
3. **DISMISSED**: Police/Admin marks as false positive
   - Case stays `ACTIVE`, continues matching

### Deduplication
- Before creating an alert, the system checks if an alert for the same person was created in the last **60 seconds**
- Prevents flooding officers with repeated alerts for the same person visible on camera

---

## 6. Technology Stack Deep Dive

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Core language |
| Django 5.x | Web framework | REST API, ORM, admin |
| Django REST Framework | API layer | Serializers, viewsets |
| Celery | Task queue | Background face processing |
| Redis | Message broker | Celery task transport |
| PostgreSQL | Database | Relational data + JSON embeddings |
| face_recognition (dlib) | ML library | Face detection, landmark detection, embedding generation |
| OpenCV | Computer vision | Video capture, Haar cascade, image encoding |
| SimpleJWT | Auth | Token-based authentication |

### Frontend

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite | Build tool (fast HMR) |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| Recharts | Data visualization |
| Socket.IO Client | Real-time alert reception |

### Real-time

| Technology | Purpose |
|-----------|---------|
| Express.js | HTTP server for alert push endpoint |
| Socket.IO | Bi-directional WebSocket communication |

---

## 7. Database Schema (Key Models)

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   User          │    │   MissingPerson       │    │  CCTVCamera     │
├─────────────────┤    ├──────────────────────┤    ├─────────────────┤
│ id              │    │ id                    │    │ id              │
│ username        │    │ name                  │    │ name            │
│ role (CITIZEN/  │◄───│ reported_by (FK)      │    │ stream_url      │
│  POLICE/ADMIN)  │    │ age, gender           │    │ location_name   │
│ email           │    │ description           │    │ latitude        │
│ phone_number    │    │ status (ACTIVE/FOUND/ │    │ longitude       │
│                 │    │  CLOSED)              │    │ is_active       │
└─────────────────┘    │ last_seen_location    │    └────────┬────────┘
                       │ last_seen_time        │             │
                       └──────────┬───────────┘             │
                                  │                          │
                       ┌──────────▼───────────┐             │
                       │ MissingPersonImage    │             │
                       ├──────────────────────┤             │
                       │ id                    │             │
                       │ case (FK)             │             │
                       │ image (ImageField)    │             │
                       │ face_embedding (JSON) │ ◄── 128-d vector
                       │ is_primary            │             │
                       └──────────────────────┘             │
                                                            │
                       ┌──────────────────────┐             │
                       │ DetectionAlert        │             │
                       ├──────────────────────┤             │
                       │ id                    │             │
                       │ missing_person (FK) ──┘             │
                       │ camera (FK) ──────────────────────┘
                       │ snapshot (ImageField)
                       │ confidence_score
                       │ status (PENDING/VERIFIED/DISMISSED)
                       │ verified_by (FK → User)
                       │ detected_at
                       └──────────────────────┘
```

---

## 8. Security Features

| Feature | Implementation |
|---------|---------------|
| **JWT Authentication** | Access + refresh tokens via SimpleJWT |
| **Role-Based Access Control** | CITIZEN, POLICE, ADMIN — enforced on backend + frontend |
| **MFA** | TOTP-based two-factor auth via `django-otp` |
| **CORS Protection** | `django-cors-headers` — whitelisted origins only |
| **Password Hashing** | Django's PBKDF2 with SHA256 (industry standard) |
| **CSRF Protection** | Django middleware (enabled for session-based views) |

---

## 9. Key Algorithms Summary

| Algorithm | Used In | Purpose |
|-----------|---------|---------|
| **HOG** (Histogram of Oriented Gradients) | Face detection | Locating faces in images |
| **68-point Facial Landmarks** | Face alignment | Normalizing face orientation |
| **ResNet** (Deep Residual Network) | Embedding generation | Converting face to 128-d vector |
| **Euclidean Distance** | Face matching | Comparing two embeddings |
| **Haar Cascade** | Stream capture | Fast face screening in video frames |
| **Triplet Loss** | ResNet training (pre-trained) | Ensuring same faces are close, different faces are far |

---

## 10. Viva Questions & Answers

**Q: What is face recognition vs face detection?**
> **Detection** = finding where faces are in an image (bounding boxes). **Recognition** = identifying whose face it is (matching against known faces).

**Q: Why 128 dimensions for the embedding?**
> The ResNet model in dlib was designed and trained to output 128 values. This dimensionality provides a good balance between discriminative power and computational efficiency. It achieves 99.38% accuracy on the LFW (Labeled Faces in the Wild) benchmark.

**Q: What is Euclidean distance?**
> It's the straight-line distance between two points in multi-dimensional space. For 128-d vectors: `d = √(∑(aᵢ - bᵢ)²)`. Lower distance = more similar faces.

**Q: Why not use cosine similarity instead of Euclidean distance?**
> The `face_recognition` library's model was specifically trained with Euclidean distance in mind using triplet loss. The embeddings are L2-normalized during training, making Euclidean distance more appropriate.

**Q: How does Celery help?**
> Celery offloads heavy face recognition to a background worker process. This means the web server (Django) stays responsive, the video stream isn't blocked, and multiple frames can be processed in parallel.

**Q: What is MJPEG streaming?**
> Motion JPEG — the server sends a continuous stream of JPEG images as an HTTP multipart response. The browser's `<img>` tag renders each frame in sequence, creating the illusion of video. Simple, no WebRTC needed.

**Q: What happens if the same person is detected multiple times?**
> A 60-second deduplication window prevents duplicate alerts. Additionally, once an alert is verified, the case is marked FOUND and that person's embeddings are excluded from all future searches.

**Q: Why two-stage face detection?**
> Stage 1 (Haar Cascade, ~30ms) quickly checks if a face exists — runs in the stream thread. Stage 2 (HOG + ResNet, ~1s) does accurate recognition — runs in Celery. This separation keeps the stream smooth.

**Q: How is the system scalable?**
> Multiple Celery workers can process frames in parallel. Each camera runs its own capture thread. The Node.js server handles thousands of WebSocket connections. The database uses efficient JSON storage for embeddings.
