// src/routes/profiles.js
import express from 'express';
import {
  getProfile,
  updateProfileImage,
  removeProfileImage,
  createOrUpdateProfile
} from '../controllers/profileController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create or update user profile
router.post('/:userId/create', protect, createOrUpdateProfile);

// Get user profile
router.get('/:userId', protect, getProfile);

// Update profile image
router.put('/:userId/image', protect, updateProfileImage);

// Remove profile image
router.delete('/:userId/image', protect, removeProfileImage);

export default router;