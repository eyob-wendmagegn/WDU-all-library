// src/controllers/paymentController.js
import { connectDB } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

const calculateFine = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const msDiff = now - due;
  const daysLate = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
  return daysLate * 10;
};

export const getFine = async (req, res) => {
  const { userId, username } = req.body;
  if (!userId || !username) return res.status(400).json({ message: 'userId & username required' });

  try {
    const db = await connectDB();
    const borrow = await db.collection('borrows').findOne({
      userId,
      username,
      returnedAt: null,
    });
    if (!borrow) return res.status(404).json({ message: 'No active borrow' });

    const fine = calculateFine(borrow.dueDate);
    res.json({ fine, borrowId: borrow._id.toString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const initPayment = async (req, res) => {
  const { amount, borrowId } = req.body;
  if (!amount || amount <= 0 || !borrowId) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  const tx_ref = `fine-${uuidv4()}`;

  try {
    const db = await connectDB();

    await db.collection('payments').insertOne({
      userId: req.user.id,
      username: req.user.username,
      amount,
      borrowId,
      tx_ref,
      method: 'chapa',
      status: 'pending',
      createdAt: new Date(),
    });

    res.json({ checkout_url: 'https://checkout.chapa.co/checkout/payment/fake-test-url', tx_ref });
  } catch (e) {
    console.error(e.response?.data || e);
    res.status(500).json({ message: 'Payment init failed' });
  }
};

export const verifyPayment = async (req, res) => {
  const { tx_ref, status } = req.body;
  if (!tx_ref) return res.status(400).json({ message: 'tx_ref missing' });

  try {
    const db = await connectDB();
    const payment = await db.collection('payments').findOneAndUpdate(
      { tx_ref },
      { $set: { status: status === 'success' ? 'completed' : 'failed' } },
      { returnDocument: 'after' }
    );

    if (!payment.value) return res.status(404).json({ message: 'Payment not found' });

    if (status === 'success') {
      const borrow = await db.collection('borrows').findOneAndUpdate(
        { _id: new ObjectId(payment.value.borrowId) },
        {
          $set: {
            fine: 0,
            returnedAt: new Date(),
            status: 'returned'
          },
        },
        { returnDocument: 'after' }
      );

      if (borrow.value) {
        await db.collection('books').updateOne(
          { id: borrow.value.bookId },
          { $inc: { copies: 1 } }
        );
      }
    }

    res.json({ message: 'Webhook processed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const initTelebirrPayment = async (req, res) => {
  const { amount, borrowId, mobile } = req.body;

  if (!amount || amount <= 0 || !borrowId || !mobile) {
    return res.status(400).json({ message: 'All fields required' });
  }

  if (!mobile.match(/^09\d{8}$/)) {
    return res.status(400).json({ message: 'Invalid mobile (09.......)' });
  }

  try {
    const db = await connectDB();

    const tx_ref = `telebirr-${uuidv4()}`;

    await db.collection('payments').insertOne({
      userId: req.user.id,
      username: req.user.username,
      amount: Number(amount),
      borrowId,
      mobile,
      tx_ref,
      method: 'telebirr',
      status: 'completed',
      createdAt: new Date(),
    });

    const borrow = await db.collection('borrows').findOneAndUpdate(
      { _id: new ObjectId(borrowId), userId: req.user.id },
      {
        $set: {
          fine: 0,
          returnedAt: new Date(),
          status: 'returned',
        },
      },
      { returnDocument: 'after' }
    );

    if (!borrow.value) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    await db.collection('books').updateOne(
      { id: borrow.value.bookId },
      { $inc: { copies: 1 } }
    );

    res.json({
      success: true,
      message: 'Fine paid via Telebirr – book returned!',
      tx_ref,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};