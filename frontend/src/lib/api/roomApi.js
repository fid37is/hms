import api from '../axios';

// Room Types
export const getRoomTypes     = ()            => api.get('/rooms/types');
export const createRoomType   = (data)        => api.post('/rooms/types', data);
export const updateRoomType   = (id, d)       => api.patch(`/rooms/types/${id}`, d);
export const deleteRoomType   = (id)          => api.delete(`/rooms/types/${id}`);

// Rate Plans
export const getRatePlans     = (typeId)      => api.get(`/rooms/types/${typeId}/rates`);
export const createRatePlan   = (typeId, data)=> api.post(`/rooms/types/${typeId}/rates`, data);
export const deleteRatePlan   = (id)          => api.delete(`/rooms/rates/${id}`);

// Availability — maps check_in_date/check_out_date to what the backend expects
export const checkAvailability = ({ check_in_date, check_out_date, type_id } = {}) =>
  api.get('/rooms/availability', {
    params: { check_in: check_in_date, check_out: check_out_date, type_id },
  });

// Rooms
export const getRooms         = (params)      => api.get('/rooms', { params });
export const getRoomById      = (id)          => api.get(`/rooms/${id}`);
export const createRoom       = (data)        => api.post('/rooms', data);
export const updateRoom       = (id, d)       => api.patch(`/rooms/${id}`, d);
export const deleteRoom       = (id)          => api.delete(`/rooms/${id}`);
export const updateRoomStatus = (id, d)       => api.patch(`/rooms/${id}/status`, d);
export const blockRoom        = (id, d)       => api.patch(`/rooms/${id}/block`, d);
export const unblockRoom      = (id)          => api.patch(`/rooms/${id}/unblock`);

// Media — use api instance so the auth token is always sent
export const uploadRoomMedia = (roomId, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/rooms/${roomId}/media`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteRoomMedia = (roomId, path) =>
  api.delete(`/rooms/${roomId}/media`, { data: { path } });