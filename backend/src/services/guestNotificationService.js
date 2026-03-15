// src/services/guestNotificationService.js
//
// Emits real-time notifications to a specific guest via socket.io.
//
// Guest sockets join a personal room on connection:
//   Account guests  → guest:{guest_id}       (token has sub)
//   Booking guests  → guest:{reservation_id} (token has reservation_id, no sub)
//
// notifyGuest() accepts both guestId and reservationId and targets whichever
// room is populated. Pass both whenever available so either guest type is reached.
//
// Usage from any controller:
//   import { notifyGuest } from '../services/guestNotificationService.js';
//   notifyGuest(req.app, {
//     guestId:       reservation.guest_id,   // may be null for booking-token guests
//     reservationId: reservation.id,         // fallback room key
//     type:          'reservation_updated',
//     event:         'checked_in',
//     reservation:   { id, reservation_no, rooms: { number: '204' } },
//   });

export const notifyGuest = (app, {
  guestId,
  reservationId,
  type = 'guest_notification',
  ...payload
}) => {
  try {
    const io = app.get('io');
    if (!io) {
      console.error('[notifyGuest] io not found on app');
      return;
    }

    console.log('[notifyGuest] emitting', type, '→ guestId:', guestId, '| reservationId:', reservationId);

    // Emit to account-guest room if we have a guest_id
    if (guestId)       io.to(`guest:${guestId}`).emit(type, payload);

    // Emit to booking-token-guest room if we have a reservation_id.
    // When both are present they target different rooms — account guests join
    // guest:{guestId} not guest:{reservationId}, so no double-notification risk.
    if (reservationId) io.to(`guest:${reservationId}`).emit(type, payload);

    if (!guestId && !reservationId) {
      console.warn('[notifyGuest] no guestId or reservationId — notification not sent');
    }
  } catch (err) {
    console.error('[notifyGuest] error:', err.message);
  }
};

// ── Convenience wrappers ──────────────────────────────────────────────────────

export const notifyGuestCheckedIn = (app, reservation) =>
  notifyGuest(app, {
    guestId:       reservation.guest_id  || null,
    reservationId: reservation.id,
    type:          'reservation_updated',
    event:         'checked_in',
    reservation: {
      id:             reservation.id,
      reservation_no: reservation.reservation_no,
      rooms:          reservation.rooms       || null,
      room_number:    reservation.room_number || null,
    },
  });

export const notifyGuestCheckedOut = (app, reservation) =>
  notifyGuest(app, {
    guestId:       reservation.guest_id || null,
    reservationId: reservation.id,
    type:          'reservation_updated',
    event:         'checked_out',
    reservation: {
      id:             reservation.id,
      reservation_no: reservation.reservation_no,
    },
  });

export const notifyGuestCancelled = (app, reservation) =>
  notifyGuest(app, {
    guestId:       reservation.guest_id || null,
    reservationId: reservation.id,
    type:          'reservation_updated',
    event:         'cancelled',
    reservation: {
      id:             reservation.id,
      reservation_no: reservation.reservation_no,
    },
  });