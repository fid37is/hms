// src/lib/api/nightAuditApi.js
import api from '../axios';

export const getPreview = (date)   => api.get('/night-audit/preview', { params: { date } });
export const getStatus  = (date)   => api.get('/night-audit/status',  { params: { date } });
export const getHistory = (limit)  => api.get('/night-audit/history',  { params: { limit } });
export const runAudit   = (date)   => api.post('/night-audit/run', { date });