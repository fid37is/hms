import api from '../axios';
export const login         = (data)  => api.post('/auth/login', data);
export const logout        = ()      => api.post('/auth/logout');
export const getProfile    = ()      => api.get('/auth/profile');
export const changePassword = (data) => api.patch('/auth/change-password', data);
export const forgotPassword  = (data) => api.post('/auth/forgot-password', data);
export const adminResetPassword = (userId, data) => api.patch(`/users/${userId}/reset-password`, data);