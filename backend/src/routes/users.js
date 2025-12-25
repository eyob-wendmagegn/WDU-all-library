//routes/user.js
import express from 'express';
import {
  getMe,
  getUsers,
  createUser,
  importUsers,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js'; // ← CORRECT PATH

const router = express.Router();

// GET current user profile
router.get('/me', protect, getMe);

// ADMIN ROUTES
router.get('/', protect, adminOnly, getUsers);
router.post('/', protect, adminOnly, createUser);
router.post('/import', protect, adminOnly, importUsers); // New Route
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);

export default router;