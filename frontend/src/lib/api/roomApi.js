import api from '../axios';
// Room Types
export const getRoomTypes       = ()       => api.get('/rooms/types');
export const createRoomType     = (data)   => api.post('/rooms/types', data);
export const updateRoomType     = (id, d)  => api.patch(`/rooms/types/${id}`, d);
export const deleteRoomType     = (id)     => api.delete(`/rooms/types/${id}`);
// Rate Plans
export const getRatePlans       = (typeId) => api.get(`/rooms/types/${typeId}/rates`);
export const createRatePlan     = (typeId, data) => api.post(`/rooms/types/${typeId}/rates`, data);
export const deleteRatePlan     = (id)     => api.delete(`/rooms/rates/${id}`);
// Rooms
export const getRooms           = (params) => api.get('/rooms', { params });
export const getRoomById        = (id)     => api.get(`/rooms/${id}`);
export const createRoom         = (data)   => api.post('/rooms', data);
export const updateRoom         = (id, d)  => api.patch(`/rooms/${id}`, d);
export const deleteRoom         = (id)     => api.delete(`/rooms/${id}`);
export const updateRoomStatus   = (id, d)  => api.patch(`/rooms/${id}/status`, d);
export const blockRoom          = (id, d)  => api.patch(`/rooms/${id}/block`, d);
export const unblockRoom        = (id)     => api.patch(`/rooms/${id}/unblock`);
export const checkAvailability  = (params) => api.get('/rooms/available', { params });
