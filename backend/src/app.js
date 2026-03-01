// src/app.js

import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import rateLimit  from 'express-rate-limit';

import { env }            from './config/env.js';
import { requestLogger }  from './middleware/requestLogger.js';
import { errorHandler }   from './middleware/errorHandler.js';
import router             from './routes/index.js';
import publicRoutes       from './routes/publicRoutes.js';

const app = express();

// ── 1. CORS must be first — before any routes ─────────────────────────────────
app.use(cors({
  origin: [
    env.FRONTEND_URL,              // HMS frontend (http://localhost:5173)
    env.WEBSITE_URL  || 'http://localhost:5174',  // Hotel website
  ],
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── 2. Security & parsing ─────────────────────────────────────────────────────
app.use(helmet());
app.use(rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  message:         { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ── 3. Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HMS API is running',
    env:     env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

// ── 4. Routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/public', publicRoutes);   // hotel website (public, guest-facing)
app.use('/api/v1',        router);         // HMS dashboard (staff, authenticated)

// ── 5. 404 & error handler ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use(errorHandler);

export default app;