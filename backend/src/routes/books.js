// src/routes/books.js
import express from 'express';
import {
  addBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} from '../controllers/bookController.js';
import { protect, adminOrLibrarian, canAddBook } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, canAddBook, addBook);
router.put('/:id', protect, adminOrLibrarian, updateBook);
router.delete('/:id', protect, adminOrLibrarian, deleteBook);
router.get('/', protect, getBooks);
router.get('/id/:id', protect, getBookById);

export default router;