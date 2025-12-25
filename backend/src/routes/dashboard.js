// src/routes/dashboard.js
import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect, adminOnly, librarianOnly, teacherOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get(
  '/',
  protect,
  (req, res, next) => {
    // Allow all authenticated roles
    if (req.user.role === 'admin') return adminOnly(req, res, next);
    if (req.user.role === 'librarian') return librarianOnly(req, res, next);
    if (req.user.role === 'teacher') return teacherOnly(req, res, next);
    if (req.user.role === 'student') return next(); // NEW: Allow student
    return res.status(403).json({ message: 'Access denied' });
  },
  getDashboardStats
);

export default router;