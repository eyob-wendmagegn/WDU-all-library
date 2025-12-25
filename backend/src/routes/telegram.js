import express from 'express';
import { redirectToTelegram } from '../controllers/telegramController.js';

const router = express.Router();

// GET /api/telegram
router.get('/', redirectToTelegram);

export default router;