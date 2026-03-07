// HMS/frontend/src/lib/api/departmentApi.js
// Chat departments — separate from org/HR departments
import api from '../axios';

export const getAllDepartments = ()         => api.get('/chat-departments');
export const createDepartment = (body)     => api.post('/chat-departments', body);
export const updateDepartment = (id, body) => api.patch(`/chat-departments/${id}`, body);
export const deleteDepartment = (id)       => api.delete(`/chat-departments/${id}`);
