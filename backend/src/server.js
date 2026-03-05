// src/server.js

import { createServer } from 'http';
import { Server }       from 'socket.io';
import app              from './app.js';
import { env }          from './config/env.js';

const PORT       = env.PORT;
const httpServer = createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const allowedOrigins = [
  ...((env.FRONTEND_URL || 'http://localhost:5173').split(',').map(o => o.trim())),
  ...((env.WEBSITE_URL  || 'http://localhost:5174').split(',').map(o => o.trim())),
];

const io = new Server(httpServer, {
  cors: {
    origin:      (origin, cb) => {
      if (!origin) return cb(null, true);
      if (env.isDev && /^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Socket CORS: ${origin} not allowed`));
    },
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Make io available in controllers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  // Staff join their department room  →  "dept:<departmentId>"
  socket.on('join_department', (departmentId) => {
    socket.join(`dept:${departmentId}`);
  });

  // Guest / staff join a specific conversation room  →  "conv:<conversationId>"
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv:${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv:${conversationId}`);
  });

  socket.on('disconnect', () => {});
});

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log('--------------------------------------------------');
  console.log('HMS Backend API');
  console.log('--------------------------------------------------');
  console.log(`Environment : ${env.NODE_ENV}`);
  console.log(`Server      : http://localhost:${PORT}`);
  console.log(`Health      : http://localhost:${PORT}/health`);
  console.log(`API Base    : http://localhost:${PORT}/api/v1`);
  console.log(`Socket.IO   : ws://localhost:${PORT}`);
  console.log('--------------------------------------------------');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  httpServer.close(() => { console.log('Server closed.'); process.exit(0); });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  httpServer.close(() => process.exit(1));
});