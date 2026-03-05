// HMS/frontend/src/lib/api/conversationApi.js
import api from '../axios';

export const getAllConversations         = ()                => api.get('/conversations');
export const getDepartmentConversations = (deptId)          => api.get(`/conversations/department/${deptId}`);
export const getUnreadCount             = (deptId)          => api.get(`/conversations/department/${deptId}/unread`);
export const getMessages                = (convId)          => api.get(`/conversations/${convId}/messages`);
export const sendMessage                = (convId, content) => api.post(`/conversations/${convId}/messages`, { content });
export const closeConversation          = (convId)          => api.patch(`/conversations/${convId}/close`);