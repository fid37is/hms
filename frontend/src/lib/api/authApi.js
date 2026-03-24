import api from '../axios';

export const login            = (data)  => api.post('/auth/login', data);
export const logout           = ()      => api.post('/auth/logout');
export const getProfile       = ()      => api.get('/auth/me');
export const changePassword      = (data)  => api.patch('/auth/change-password', data);
export const forceChangePassword = (data)  => api.patch('/auth/force-change-password', data);
export const forgotPassword   = (data)  => api.post('/auth/forgot-password', data);
export const registerOrg      = (data)  => api.post('/auth/register-org', data);
export const adminResetPassword = (userId, data) => api.patch(`/users/${userId}/reset-password`, data);

// API key management
export const listApiKeys  = ()        => api.get('/auth/api-keys');
export const generateApiKey = (data)  => api.post('/auth/api-keys', data);
export const revokeApiKey = (id)      => api.delete(`/auth/api-keys/${id}`);

// Organisation profile (slug, custom domain)
export const getOrg    = ()      => api.get('/auth/org');
export const updateOrg = (data)  => api.patch('/auth/org', data);
export const getUserOrgs = ()         => api.get('/auth/orgs');
export const switchOrg   = (org_id)   => api.post('/auth/orgs/switch', { org_id });
export const createOrg   = (org_name) => api.post('/auth/orgs/create', { org_name });