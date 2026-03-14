/**
 * Deep Vision — Real-Time Server
 *
 * Express + Socket.IO server that:
 * 1. Receives alert pushes from Django/Celery via POST /api/alerts/push
 * 2. Broadcasts alerts to connected React clients via Socket.IO
 * 3. Supports per-officer rooms for targeted notifications
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// ── CORS config ─────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());

// ── Socket.IO ───────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Track connected clients
let connectedClients = 0;

io.on('connection', (socket) => {
  connectedClients++;
  console.log(`🟢 Client connected: ${socket.id} (Total: ${connectedClients})`);

  // Officers join their own room for targeted notifications
  socket.on('join_officer_room', (officerId) => {
    const room = `officer_${officerId}`;
    socket.join(room);
    console.log(`👮 Officer ${officerId} joined room: ${room}`);
  });

  // Admins join the admin room
  socket.on('join_admin_room', () => {
    socket.join('admin_room');
    console.log(`🛡️ Admin joined admin_room`);
  });

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`🔴 Client disconnected: ${socket.id} (Total: ${connectedClients})`);
  });
});

// ── REST API: Receive alerts from Django ────────────────────

/**
 * POST /api/alerts/push
 * Called by Django Celery task (notify_nearby_officers)
 *
 * Body: {
 *   alert_id: number,
 *   missing_person_name: string,
 *   camera_name: string,
 *   camera_location: string,
 *   confidence_score: number,
 *   officer_ids: number[],
 *   snapshot_url: string (optional)
 * }
 */
app.post('/api/alerts/push', (req, res) => {
  const alert = req.body;

  console.log(`\n🚨 NEW ALERT received from Django:`);
  console.log(`   Person: ${alert.missing_person_name}`);
  console.log(`   Camera: ${alert.camera_name} (${alert.camera_location})`);
  console.log(`   Confidence: ${(alert.confidence_score * 100).toFixed(1)}%`);
  console.log(`   Officers to notify: ${alert.officer_ids?.length || 0}`);

  // Broadcast to ALL connected clients (for dashboard updates)
  io.emit('new_alert', {
    ...alert,
    timestamp: new Date().toISOString(),
  });

  // Also send to specific officer rooms
  if (alert.officer_ids && alert.officer_ids.length > 0) {
    alert.officer_ids.forEach((officerId) => {
      io.to(`officer_${officerId}`).emit('officer_alert', {
        ...alert,
        timestamp: new Date().toISOString(),
      });
    });
  }

  // Notify admin room
  io.to('admin_room').emit('admin_alert', {
    ...alert,
    timestamp: new Date().toISOString(),
  });

  res.json({
    status: 'ok',
    message: 'Alert broadcasted',
    connected_clients: connectedClients,
  });
});

/**
 * POST /api/camera/frame
 * Receives a camera frame update for live streaming relay
 * Body: { camera_id, frame_base64 }
 */
app.post('/api/camera/frame', (req, res) => {
  const { camera_id, frame_base64 } = req.body;

  if (camera_id && frame_base64) {
    io.emit('camera_frame', { camera_id, frame_base64 });
  }

  res.json({ status: 'ok' });
});

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'deepvision-realtime',
    connected_clients: connectedClients,
    uptime: process.uptime(),
  });
});

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  Deep Vision Real-Time Server          ║`);
  console.log(`║  Running on http://localhost:${PORT}       ║`);
  console.log(`║  Socket.IO ready for connections       ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});
