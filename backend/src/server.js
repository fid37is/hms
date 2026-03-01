// src/server.js

import app        from './app.js';
import { env }    from './config/env.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log('--------------------------------------------------');
  console.log('HMS Backend API');
  console.log('--------------------------------------------------');
  console.log(`Environment : ${env.NODE_ENV}`);
  console.log(`Server      : http://localhost:${PORT}`);
  console.log(`Health      : http://localhost:${PORT}/health`);
  console.log(`API Base    : http://localhost:${PORT}/api/v1`);
  console.log('--------------------------------------------------');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  server.close(() => process.exit(1));
});