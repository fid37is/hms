// src/routes/conversationRoutes.js
// Staff-facing conversation routes (HMS dashboard)
// Guest-facing routes live in publicRoutes.js

import { Router }            from 'express';
import { authenticate }      from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS }       from '../config/constants.js';
import {
  getAllConversations,
  getDepartmentConversations,
  getMessages,
  sendMessage,
  closeConversation,
  getUnreadCounts,
} from '../controllers/conversationController.js';

const router = Router();
router.use(authenticate);

// All conversations (admin / front desk overview)
router.get('/',
  requirePermission(PERMISSIONS.CONVERSATIONS?.READ ?? PERMISSIONS.RESERVATIONS.READ),
  getAllConversations);

// Conversations for a specific department
router.get('/department/:departmentId',
  requirePermission(PERMISSIONS.CONVERSATIONS?.READ ?? PERMISSIONS.RESERVATIONS.READ),
  getDepartmentConversations);

// Unread count for a department
router.get('/department/:departmentId/unread',
  requirePermission(PERMISSIONS.CONVERSATIONS?.READ ?? PERMISSIONS.RESERVATIONS.READ),
  getUnreadCounts);

// Messages in a conversation
router.get('/:id/messages',
  requirePermission(PERMISSIONS.CONVERSATIONS?.READ ?? PERMISSIONS.RESERVATIONS.READ),
  getMessages);

// Send a message (staff side)
router.post('/:id/messages',
  requirePermission(PERMISSIONS.CONVERSATIONS?.READ ?? PERMISSIONS.RESERVATIONS.READ),
  sendMessage);

// Close a conversation
router.patch('/:id/close',
  requirePermission(PERMISSIONS.CONVERSATIONS?.READ ?? PERMISSIONS.RESERVATIONS.READ),
  closeConversation);

export default router;