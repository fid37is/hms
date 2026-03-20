// src/app.js

import express   from 'express';
import cors      from 'cors';
import helmet    from 'helmet';
import rateLimit from 'express-rate-limit';

import { env }             from './config/env.js';
import { requestLogger }   from './middleware/requestLogger.js';
import { errorHandler }    from './middleware/errorHandler.js';
import router              from './routes/index.js';
import publicRoutes        from './routes/publicRoutes.js';
import superAdminRoutes    from './routes/superAdminRoutes.js';

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render, Railway, Heroku etc)

// ── 1. CORS ───────────────────────────────────────────────────────────────────
const parseOrigins = (val, fallback) =>
  (val || fallback).split(',').map(o => o.trim()).filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(env.FRONTEND_URL, 'http://localhost:5173'),
  ...parseOrigins(env.WEBSITE_URL,  'http://localhost:5174'),
];

const WEBSITE_BASE_DOMAIN = env.WEBSITE_BASE_DOMAIN || 'miravance.io';

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    // Allow any subdomain of our base domain (*.miravance.io)
    if (origin.endsWith(`.${WEBSITE_BASE_DOMAIN}`)) return callback(null, true);

    // Dev: allow any localhost port
    if (env.isDev && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);

    // Explicit allow list (HMS dashboard + known website URLs)
    if (allowedOrigins.includes(origin)) return callback(null, true);

    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials:          true,
  methods:              ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:       ['Content-Type', 'Authorization', 'X-API-Key', 'X-Org-Slug'],  // ✅ API key + org slug headers
  optionsSuccessStatus: 200,
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ── 2. Security & parsing ─────────────────────────────────────────────────────
app.use(helmet());
app.use(rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             200,
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
app.use('/api/v1/public', publicRoutes);  // hotel website (public, guest-facing)
app.use('/api/v1/super-admin', superAdminRoutes); // platform owner console (separate auth)
app.use('/api/v1',            router);             // HMS dashboard (staff, authenticated)

// ── 5. 404 & error handler ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use(errorHandler);

export default app;