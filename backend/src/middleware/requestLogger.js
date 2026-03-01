// src/middleware/requestLogger.js

import morgan from 'morgan';
import { env } from '../config/env.js';

const devFormat  = ':method :url :status :response-time ms';
const prodFormat = ':remote-addr :method :url :status :response-time ms - :res[content-length]';

export const requestLogger = morgan(
  env.isDev ? devFormat : prodFormat,
  {
    skip: (req) => req.url === '/health',
  }
);