// models/paymentModel.js
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

/**
 * Payment Model
 * Contains all database queries for payment operations
 * This follows the same structure as your existing code
 */
export class PaymentModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('payments');
    this.borrowsCollection = db.collection('borrows');
    this.booksCollection = db.collection('books');
  }

  /**
   * Helper: Calculate fine based on due date
   */
  calculateFine(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const msDiff = now - due;
    const daysLate = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    return daysLate * 10;
  }

  /**
   * Get fine for active borrow
   */
  async getFine(userId, username) {
    if (!userId || !username) {
      throw new Error('userId & username required');
    }

    const borrow = await this.borrowsCollection.findOne({
      userId,
      username,
      returnedAt: null,
    });

    if (!borrow) {
      return { fine: 0, borrowId: null, borrow: null };
    }

    const fine = this.calculateFine(borrow.dueDate);
    return {
      fine,
      borrowId: borrow._id.toString(),
      borrow: {
        bookId: borrow.bookId,
        bookName: borrow.bookName,
        bookTitle: borrow.bookTitle,
        dueDate: borrow.dueDate,
        borrowedAt: borrow.borrowedAt
      }
    };
  }

  /**
   * Initialize payment
   */
  async initPayment(userId, username, amount, borrowId, method = 'chapa') {
    if (!amount || amount <= 0 || !borrowId) {
      throw new Error('Invalid request parameters');
    }

    const tx_ref = `fine-${uuidv4()}`;

    const paymentData = {
      userId,
      username,
      amount,
      borrowId,
      tx_ref,
      method,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(paymentData);
    return { ...paymentData, _id: result.insertedId };
  }

  /**
   * Verify payment (webhook handler)
   */
  async verifyPayment(tx_ref, status) {
    if (!tx_ref) {
      throw new Error('tx_ref missing');
    }

    // Find and update payment
    const payment = await this.collection.findOneAndUpdate(
      { tx_ref },
      { 
        $set: { 
          status: status === 'success' ? 'completed' : 'failed',
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    if (!payment.value) {
      throw new Error('Payment not found');
    }

    const result = {
      payment: payment.value,
      borrowUpdated: false,
      bookUpdated: false
    };

    if (status === 'success') {
      // Update borrow record
      const borrowUpdate = await this.borrowsCollection.findOneAndUpdate(
        { _id: new ObjectId(payment.value.borrowId) },
        {
          $set: {
            fine: 0,
            returnedAt: new Date(),
            status: 'returned',
            updatedAt: new Date()
          },
        },
        { returnDocument: 'after' }
      );

      if (borrowUpdate.value) {
        result.borrowUpdated = true;
        
        // Return book copy to inventory
        const bookUpdate = await this.booksCollection.updateOne(
          { id: borrowUpdate.value.bookId },
          { $inc: { copies: 1 } }
        );

        result.bookUpdated = bookUpdate.modifiedCount > 0;
      }
    }

    return result;
  }

  /**
   * Initialize Telebirr payment
   */
  async initTelebirrPayment(userId, username, amount, borrowId, mobile) {
    if (!amount || amount <= 0 || !borrowId || !mobile) {
      throw new Error('All fields required');
    }

    if (!mobile.match(/^09\d{8}$/)) {
      throw new Error('Invalid mobile (09.......)');
    }

    const tx_ref = `telebirr-${uuidv4()}`;

    // Create payment record
    const paymentData = {
      userId,
      username,
      amount: Number(amount),
      borrowId,
      mobile,
      tx_ref,
      method: 'telebirr',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const paymentResult = await this.collection.insertOne(paymentData);
    const payment = { ...paymentData, _id: paymentResult.insertedId };

    // Update borrow record
    const borrowUpdate = await this.borrowsCollection.findOneAndUpdate(
      { _id: new ObjectId(borrowId), userId: userId },
      {
        $set: {
          fine: 0,
          returnedAt: new Date(),
          status: 'returned',
          updatedAt: new Date()
        },
      },
      { returnDocument: 'after' }
    );

    if (!borrowUpdate.value) {
      throw new Error('Borrow record not found');
    }

    // Return book copy to inventory
    const bookUpdate = await this.booksCollection.updateOne(
      { id: borrowUpdate.value.bookId },
      { $inc: { copies: 1 } }
    );

    return {
      success: true,
      payment,
      borrow: borrowUpdate.value,
      bookUpdated: bookUpdate.modifiedCount > 0,
      tx_ref
    };
  }

  /**
   * Get payment by ID
   */
  async getById(paymentId) {
    if (!ObjectId.isValid(paymentId)) {
      return null;
    }

    return await this.collection.findOne({ _id: new ObjectId(paymentId) });
  }

  /**
   * Get payment by transaction reference
   */
  async getByTxRef(tx_ref) {
    return await this.collection.findOne({ tx_ref });
  }

  /**
   * Get user payments
   */
  async getUserPayments(userId, page = 1, limit = 10) {
    const query = { userId };

    const payments = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get all payments with filters
   */
  async getAllPayments({ page = 1, limit = 10, search = '', status, method, startDate, endDate }) {
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { userId: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { tx_ref: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Method filter
    if (method) {
      query.method = method;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const payments = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get payment statistics
   */
  async getStatistics() {
    const totalPayments = await this.collection.countDocuments();
    
    const totalAmount = await this.collection.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();

    const byStatus = await this.collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]).toArray();

    const byMethod = await this.collection.aggregate([
      { $group: { _id: '$method', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]).toArray();

    const dailyStats = await this.collection.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]).toArray();

    const recentPayments = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return {
      totalPayments,
      totalAmount: totalAmount[0]?.total || 0,
      byStatus,
      byMethod,
      dailyStats,
      recentPayments,
      lastUpdated: new Date()
    };
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId, status, notes = '') {
    if (!ObjectId.isValid(paymentId)) {
      return { success: false, error: 'Invalid payment ID' };
    }

    const result = await this.collection.updateOne(
      { _id: new ObjectId(paymentId) },
      { 
        $set: { 
          status,
          notes,
          updatedAt: new Date()
        } 
      }
    );

    return {
      success: result.matchedCount > 0,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    };
  }

  /**
   * Get payments by borrow ID
   */
  async getPaymentsByBorrowId(borrowId) {
    return await this.collection
      .find({ borrowId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Check if payment exists for borrow
   */
  async hasPaymentForBorrow(borrowId) {
    const count = await this.collection.countDocuments({ 
      borrowId, 
      status: 'completed' 
    });
    return count > 0;
  }

  /**
   * Get successful payments
   */
  async getSuccessfulPayments(page = 1, limit = 10) {
    const query = { status: 'completed' };

    const payments = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      payments,
      total,
      page,
      limit
    };
  }

  /**
   * Delete payment
   */
  async deletePayment(paymentId) {
    if (!ObjectId.isValid(paymentId)) {
      return { success: false, error: 'Invalid payment ID' };
    }

    const result = await this.collection.deleteOne({ 
      _id: new ObjectId(paymentId) 
    });

    return {
      success: result.deletedCount > 0,
      deletedCount: result.deletedCount
    };
  }

  /**
   * Search payments with advanced filters
   */
  async searchPayments(searchTerm, filters = {}, page = 1, limit = 10) {
    const query = {};

    // Text search
    if (searchTerm) {
      query.$or = [
        { userId: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { tx_ref: { $regex: searchTerm, $options: 'i' } },
        { mobile: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Additional filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.method) {
      query.method = filters.method;
    }

    if (filters.minAmount || filters.maxAmount) {
      query.amount = {};
      if (filters.minAmount) {
        query.amount.$gte = Number(filters.minAmount);
      }
      if (filters.maxAmount) {
        query.amount.$lte = Number(filters.maxAmount);
      }
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    const payments = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      payments,
      total,
      page,
      limit,
      filters
    };
  }

  /**
   * Get total revenue by period
   */
  async getRevenueByPeriod(startDate, endDate) {
    const query = {
      status: 'completed',
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const payments = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const count = payments.length;

    return {
      period: { startDate, endDate },
      totalAmount,
      count,
      payments
    };
  }
}

/**
 * Initialize and export the PaymentModel instance
 */
export function initPaymentModel(db) {
  return new PaymentModel(db);
}

/**
 * Default export for convenience
 */
export default PaymentModel;