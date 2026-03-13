// src/lib/api/eventApi.js
import api from '../axios';

// Venues
export const getVenues       = ()           => api.get('/events/venues');
export const getVenue        = (id)         => api.get(`/events/venues/${id}`);
export const createVenue     = (data)       => api.post('/events/venues', data);
export const updateVenue     = (id, data)   => api.patch(`/events/venues/${id}`, data);
export const deleteVenue     = (id)         => api.delete(`/events/venues/${id}`);
export const checkAvailability = (id, params) => api.get(`/events/venues/${id}/availability`, { params });

// Events
export const getEvents       = (params)     => api.get('/events', { params });
export const getEvent        = (id)         => api.get(`/events/${id}`);
export const getUpcoming     = (days)       => api.get('/events/upcoming', { params: { days } });
export const createEvent     = (data)       => api.post('/events', data);
export const updateEvent     = (id, data)   => api.patch(`/events/${id}`, data);
export const cancelEvent     = (id, reason) => api.post(`/events/${id}/cancel`, { reason });

// Services
export const addService      = (id, data)   => api.post(`/events/${id}/services`, data);
export const updateService   = (id, sid, data) => api.patch(`/events/${id}/services/${sid}`, data);
export const voidService     = (id, sid)    => api.delete(`/events/${id}/services/${sid}`);

// Payments
export const addPayment      = (id, data)   => api.post(`/events/${id}/payments`, data);

// Staff
export const assignStaff     = (id, data)   => api.post(`/events/${id}/staff`, data);
export const removeStaff     = (id, aid)    => api.delete(`/events/${id}/staff/${aid}`);