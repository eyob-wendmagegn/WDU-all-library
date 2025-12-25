// src/routes/borrows.js
import express from 'express';
import {
  approveRequest,
  librarianBorrowBook,
  getAllBorrows,
  getMyBorrow,
  getMyRequests,
  requestBook,
  returnBook,
  getFinePolicy,
  deleteBorrow // Add this import
} from '../controllers/borrowController.js';
import { adminOrLibrarian, protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Student/Teacher routes
router.post('/request', protect, requestBook); // Request a book
router.get('/my-borrow', protect, getMyBorrow); // View active borrow (uses auth)
router.get('/my-requests', protect, getMyRequests); // View user's requests (uses auth)
router.get('/fine-policy', protect, getFinePolicy); // Get fine policy (uses auth)

// Librarian routes
router.post('/librarian-borrow', protect, adminOrLibrarian, librarianBorrowBook); // Librarian direct borrow
router.post('/approve', protect, adminOrLibrarian, approveRequest); // Approve/reject requests
router.get('/', protect, adminOrLibrarian, getAllBorrows); // View all borrows
router.delete('/:id', protect, adminOrLibrarian, deleteBorrow); // Delete borrow record - ADD THIS LINE

// Shared routes
router.post('/return', protect, returnBook); // Both user and librarian can return

export default router;