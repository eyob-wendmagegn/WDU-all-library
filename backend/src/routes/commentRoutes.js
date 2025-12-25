// src/routes/commentRoutes.js
import express from 'express';
import {
  createComment,
  getAllComments,
  getUnreadCount,
  markAllAsRead,
} from '../controllers/commentController.js';

const router = express.Router();

router.post('/', createComment);
router.get('/', getAllComments);
router.get('/unread', getUnreadCount);     // ← UNREAD COUNT
router.post('/read', markAllAsRead);      // ← MARK ALL READ

export default router;