// lib/api/userApi.js — system users, roles, staff access
import axios from '../axios';

// Users
export const getUsers        = ()          => axios.get('/users');
export const getUserById     = (id)        => axios.get(`/users/${id}`);
export const createUser      = (data)      => axios.post('/users', data);
export const updateUser      = (id, data)  => axios.patch(`/users/${id}`, data);
export const toggleUser      = (id, data)  => axios.patch(`/users/${id}/toggle`, data);

// Staff access
export const grantAccess     = (staffId, data) => axios.post(`/users/staff/${staffId}/grant`, data);
export const revokeAccess    = (staffId)        => axios.delete(`/users/staff/${staffId}/revoke`);

// Roles
export const getRoles        = ()          => axios.get('/users/roles');
export const createRole      = (data)      => axios.post('/users/roles', data);
export const deleteUser      = (id)        => axios.delete(`/users/${id}`);
export const updateRole      = (id, data)  => axios.patch(`/users/roles/${id}`, data);
export const deleteRole      = (id)        => axios.delete(`/users/roles/${id}`);