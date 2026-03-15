// src/socket.js
//
// Socket.io server — real-time chat between guests and HMS staff.
//
// ROOMS:
//   conv:{conversationId}   — joined by guest + staff in that conversation
//   dept:{departmentId}     — joined by all staff assigned to a department
//   staff:all               — joined by all connected staff (for admin overview)
//   guest:{guestId}         — personal room for account guests (targeted notifications)
//   guest:{reservationId}   — personal room for booking-token guests (no account)
//
// HOW TO WIRE INTO app.js / server.js:
//
//   import { createServer } from 'http';
//   import { initSocket }   from './socket.js';
//   const httpServer = createServer(app);
//   const io = initSocket(httpServer, app);
//   httpServer.listen(PORT);

import { Server }   from 'socket.io';
import jwt          from 'jsonwebtoken';
import { env }      from './config/env.js';
import { supabase } from './config/supabase.js';

export const initSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      env.WEBSITE_URL || 'http://localhost:5174',
      credentials: true,
    },
  });

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.data.user    = decoded;
      socket.data.isGuest = decoded.type === 'guest';
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection ───────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { user, isGuest } = socket.data;

    if (isGuest) {
      // Two guest token types both carry type: 'guest' but different payloads:
      //   Account token  → has sub (guest_id), no reservation_id
      //   Booking token  → has reservation_id, no sub
      // Join whichever room key is available so notifyGuest() can reach them.
      const guestRoomId = user.sub || user.reservation_id;
      if (guestRoomId) socket.join(`guest:${guestRoomId}`);

      socket.on('join_conversation', async ({ conversationId }) => {
        if (user.sub) {
          // Account guest — verify ownership before joining
          const { data } = await supabase
            .from('conversations')
            .select('id, guest_id')
            .eq('id', conversationId)
            .eq('guest_id', user.sub)
            .single();

          if (data) socket.join(`conv:${conversationId}`);
        } else {
          // Booking-token guest — no guest_id to check against, trust the token
          socket.join(`conv:${conversationId}`);
        }
      });
    }

    if (!isGuest) {
      socket.join('staff:all');
      if (user.org_id) socket.join(`org:${user.org_id}`);
      if (user.sub)    socket.join(`user:${user.sub}`);

      socket.on('join_department', ({ departmentId }) => {
        socket.join(`dept:${departmentId}`);
      });

      socket.on('join_conversation', ({ conversationId }) => {
        socket.join(`conv:${conversationId}`);
      });

      socket.on('leave_conversation', ({ conversationId }) => {
        socket.leave(`conv:${conversationId}`);
      });
    }

    // Typing indicator — broadcast to the conversation room (excluding sender)
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing', {
        conversationId,
        senderType: isGuest ? 'guest' : 'staff',
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('stop_typing', { conversationId });
    });
  });

  // Attach io to Express app so controllers can emit via req.app.get('io')
  app.set('io', io);

  return io;
};