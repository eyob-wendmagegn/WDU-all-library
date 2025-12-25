// src/routes/reports.js   (new file)
import express from 'express';
import { generateWeeklyReport } from '../controllers/reportController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:type', protect, adminOnly, generateWeeklyReport);

export default router;