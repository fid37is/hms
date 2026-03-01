// src/app.js

import express   from 'express';
import cors      from 'cors';
import helmet    from 'helmet';
import rateLimit from 'express-rate-limit';

import { env }           from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler }  from './middleware/errorHandler.js';
import router            from './routes/index.js';

const app = express();

// ─── Allowed origins ─────────────────────────────────────
// FRONTEND_URL can be comma-separated for multiple origins
// e.g. "https://hms-67e.pages.dev,http://localhost:5173"
const allowedOrigins = [
  ...(env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean),
  // Always allow localhost in development
  ...(env.isDev ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'] : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // Some browsers (IE11) choke on 204
};

app.use(helmet());

// Handle preflight for ALL routes before anything else
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

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

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HMS API is running',
    env:     env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

app.use('/api/v1', router);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use(errorHandler);

export default app;