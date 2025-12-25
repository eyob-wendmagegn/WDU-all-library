//routes/payment.js
import express from 'express';
import { getFine, initPayment, verifyPayment, initTelebirrPayment } from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/fine', protect, getFine);
router.post('/init', protect, initPayment);
router.post('/verify', verifyPayment);
router.post('/init-telebirr', protect, initTelebirrPayment);

export default router;