// src/middleware/auth.js

import jwt           from 'jsonwebtoken';
import { env }       from '../config/env.js';
import { sendUnauthorized } from '../utils/response.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'No token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token expired. Please log in again.');
    }
    return sendUnauthorized(res, 'Invalid token.');
  }
};