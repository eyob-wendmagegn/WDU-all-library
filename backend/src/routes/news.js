import express from 'express';
import {
  createNews,
  getNews,
  getUnreadCount,
  markNewsAsRead,
  generateIdeas,
} from '../controllers/newsController.js';

const router = express.Router();

router.post('/', createNews);
router.get('/', getNews);
router.get('/unread', getUnreadCount);
router.post('/read', markNewsAsRead);
router.post('/generate-ideas', generateIdeas);

export default router;