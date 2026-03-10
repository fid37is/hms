// src/lib/api/fnbApi.js
import api from '../axios';

export const getOutlets     = ()         => api.get('/fnb/outlets');
export const createOutlet   = (d)        => api.post('/fnb/outlets', d);
export const updateOutlet   = (id, d)    => api.patch(`/fnb/outlets/${id}`, d);

export const getCategories  = (p)        => api.get('/fnb/categories', { params: p });
export const createCategory = (d)        => api.post('/fnb/categories', d);

export const getMenu        = (p)        => api.get('/fnb/menu', { params: p });
export const createMenuItem = (d)        => api.post('/fnb/menu', d);
export const updateMenuItem = (id, d)    => api.patch(`/fnb/menu/${id}`, d);
export const deleteMenuItem = (id)       => api.delete(`/fnb/menu/${id}`);

export const getTables      = (p)        => api.get('/fnb/tables', { params: p });
export const createTable    = (d)        => api.post('/fnb/tables', d);
export const updateTableStatus = (id, s) => api.patch(`/fnb/tables/${id}/status`, { status: s });

export const getOrders      = (p)        => api.get('/fnb/orders', { params: p });
export const getOrderById   = (id)       => api.get(`/fnb/orders/${id}`);
export const createOrder    = (d)        => api.post('/fnb/orders', d);
export const addItems       = (id, d)    => api.post(`/fnb/orders/${id}/items`, d);
export const updateStatus   = (id, s)    => api.patch(`/fnb/orders/${id}/status`, { status: s });
export const billOrder      = (id)       => api.patch(`/fnb/orders/${id}/bill`);
export const cancelOrder    = (id)       => api.patch(`/fnb/orders/${id}/cancel`);