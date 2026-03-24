import api from '../axios';
export const getDashboard    = ()       => api.get('/reports/dashboard');
export const getOccupancy    = (params) => api.get('/reports/occupancy', { params });
export const getRevenue      = (params) => api.get('/reports/revenue', { params });
export const getNightAudit   = (params) => api.get('/reports/night-audit', { params });
export const getGuestReport  = (params) => api.get('/reports/guests', { params });
export const getAuditLog     = (params) => api.get('/reports/audit-log', { params });
export const getGroupSummary = (orgIds) => api.get(`/reports/group-summary?org_ids=${orgIds.join(',')}`);