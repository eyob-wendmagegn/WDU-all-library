//routes/auth.js
import express from 'express';
import { 
  firstLogin, 
  changePassword, 
  login,
  changePasswordAfterLogin,
  forgotPassword, 
  verifyOtp,
  changeUsername // ← NEW IMPORT
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/first-login', firstLogin);                    // username + ID
router.post('/change-password', changePassword);            // first-time OR reset password
router.post('/login', login);                               // normal login

// Forgot Password & OTP
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);

// Protected endpoint for changing password after login
router.post('/change-password-after-login', protect, changePasswordAfterLogin);

// NEW: Change Username (Protected)
router.post('/change-username', protect, changeUsername);

export default router;