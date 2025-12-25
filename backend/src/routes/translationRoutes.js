// src/routes/translationRoutes.js
import express from 'express';
import { getTranslations } from '../controllers/translationController.js';

const router = express.Router();
router.get('/:lang', getTranslations);
export default router;