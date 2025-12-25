// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import { connectDB } from '../config/db.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please login again' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.id) return res.status(401).json({ message: 'Invalid token payload' });

    const db = await connectDB();
    const user = await db.collection('users').findOne(
      { id: payload.id },
      { projection: { _id: 0, password: 0 } }
    );
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      needsReset: payload.needsReset ?? false,
    };
    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(401).json({ message: 'Please login again' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

export const librarianOnly = (req, res, next) => {
  if (!['librarian', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Librarian access required' });
  next();
};

export const teacherOnly = (req, res, next) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Teacher access required' });
  next();
};

export const adminOrLibrarian = (req, res, next) => {
  if (!['admin', 'librarian'].includes(req.user.role)) return res.status(403).json({ message: 'Admin/Librarian access required' });
  next();
};

export const canAddBook = (req, res, next) => {
  if (!['admin', 'librarian', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not allowed to add books' });
  }
  next();
};