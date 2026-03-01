// src/middleware/errorHandler.js

import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name       = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`);

  if (env.isDev) {
    console.error(err.stack);
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: err.message || 'A record with this information already exists.',
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
  }

  // Joi validation errors
  if (err.isJoi) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors:  err.details.map((d) => ({
        field:   d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      })),
    });
  }

  // Known application errors
  if (err.name === 'AppError') {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Fallback
  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred.',
    ...(env.isDev && { stack: err.stack }),
  });
};