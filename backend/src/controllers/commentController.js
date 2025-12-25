// src/controllers/commentController.js
import { connectDB } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const generateId = () => {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const r = uuidv4().slice(0, 8).toUpperCase();
  return `C-${d}-${r}`;
};

export const createComment = async (req, res) => {
  try {
    const { userId, username, comment } = req.body;
    if (!userId || !username || !comment)
      return res.status(400).json({ message: 'All fields required' });

    const db = await connectDB();

    const user = await db.collection('users').findOne({ id: userId, username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const c = {
      id: generateId(),
      userId,
      username,
      role: user.role,
      comment,
      createdAt: new Date(),
      readByAdmin: false, // ← UNREAD
    };

    await db.collection('comments').insertOne(c);

    res.status(201).json({ message: 'Comment sent', comment: c });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllComments = async (req, res) => {
  try {
    const db = await connectDB();
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { userId: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { comment: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const comments = await db
      .collection('comments')
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await db.collection('comments').countDocuments(query);

    res.json({ comments, total, page, limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const db = await connectDB();
    const count = await db.collection('comments').countDocuments({ readByAdmin: false });
    res.json({ count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection('comments').updateMany(
      { readByAdmin: false },
      { $set: { readByAdmin: true } }
    );
    res.json({ message: 'All comments marked as read' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};