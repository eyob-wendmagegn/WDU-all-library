//controllers/bookControllers.js
import { connectDB } from '../config/db.js';
import Joi from 'joi';

const bookSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  title: Joi.string().required(),
  category: Joi.string().required(),
  publisher: Joi.string().required(),
  isbn: Joi.string().required(),
  copies: Joi.number().integer().min(0).required(),
});


const updateBookSchema = Joi.object({
  name: Joi.string().required(),
  title: Joi.string().required(),
  category: Joi.string().required(),
  publisher: Joi.string().required(),
  isbn: Joi.string().required(),
  copies: Joi.number().integer().min(0).required(),
});

export const addBook = async (req, res) => {
  const { error, value } = bookSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();
    const existing = await db.collection('books').findOne({ id: value.id });
    if (existing) return res.status(400).json({ message: 'Book ID already exists' });

    const newBook = {
      ...value,
      addedBy: req.user ? req.user.id : null,
      createdAt: new Date()
    };

    await db.collection('books').insertOne(newBook);
    res.status(201).json({ message: 'Book added', book: newBook });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBooks = async (req, res) => {
  try {
    const db = await connectDB();
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = search
      ? {
          $or: [
            { id: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { title: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const books = await db
      .collection('books')
      .find(query)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await db.collection('books').countDocuments(query);
    res.json({ books, total, page: +page, limit: +limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBookById = async (req, res) => {
  try {
    const db = await connectDB();
    const book = await db.collection('books').findOne({ id: req.params.id });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ book });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBook = async (req, res) => {
  
  const { error, value } = updateBookSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();
    const result = await db.collection('books').updateOne(
      { id: req.params.id },
      { $set: value }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book updated' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('books').deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};