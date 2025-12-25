// models/borrowModel.js
import { ObjectId } from 'mongodb';

/**
 * Borrow Model
 * Contains all database queries for borrow operations
 * This follows the same structure as your existing code
 */
export class BorrowModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('borrows');
  }

  /**
   * Helper – calculate fine based on user type
   */
  calculateFine(dueDate, userType = 'student') {
    const now = new Date();
    const due = new Date(dueDate);
    const msDiff = now - due;
    
    if (msDiff <= 0) return 0; // Not overdue yet

    const daysLate = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    
    // Teacher: 2 days grace period, then 10 ETB per day
    if (userType === 'teacher') {
      const daysAfterGrace = Math.max(0, daysLate - 2);
      return daysAfterGrace * 10;
    }
    
    // Student: 1 day grace period, then 10 ETB per day
    if (userType === 'student') {
      const daysAfterGrace = Math.max(0, daysLate - 1);
      return daysAfterGrace * 10;
    }
    
    // Other user types: immediate fine
    return daysLate * 10;
  }

  /**
   * Find borrow by ObjectId
   */
  async findById(id) {
    if (!ObjectId.isValid(id)) return null;
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Find pending borrow request by ID
   */
  async findPendingById(borrowId) {
    if (!ObjectId.isValid(borrowId)) return null;
    return await this.collection.findOne({
      _id: new ObjectId(borrowId),
      status: 'pending'
    });
  }

  /**
   * Find active borrow for user
   */
  async findActiveBorrow(userId) {
    return await this.collection.findOne({
      userId,
      status: 'borrowed',
      returnedAt: null,
    });
  }

  /**
   * Find borrow by user and book
   */
  async findByUserAndBook(userId, bookId, status = 'borrowed') {
    return await this.collection.findOne({
      userId,
      bookId,
      status,
      returnedAt: null,
    });
  }

  /**
   * Check if user has pending or active borrow
   */
  async hasActiveBorrow(userId) {
    return await this.collection.findOne({
      userId,
      status: { $in: ['pending', 'borrowed'] },
      returnedAt: null,
    });
  }

  /**
   * Check rejected requests within time limit
   */
  async findRecentRejected(userId, bookId, hoursLimit = 24) {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - hoursLimit);

    return await this.collection.findOne({
      userId,
      bookId,
      status: 'rejected',
      approvedAt: { $gte: timeLimit }
    });
  }

  /**
   * Create borrow request
   */
  async createRequest(borrowData) {
    const borrowRequest = {
      ...borrowData,
      requestedAt: new Date(),
      status: 'pending',
      borrowedAt: null,
      returnedAt: null,
      fine: 0,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
    };

    const result = await this.collection.insertOne(borrowRequest);
    return { ...borrowRequest, _id: result.insertedId };
  }

  /**
   * Create direct borrow (librarian)
   */
  async createDirectBorrow(borrowData, approvedById) {
    const borrowRecord = {
      ...borrowData,
      borrowedAt: new Date(),
      returnedAt: null,
      fine: 0,
      status: 'borrowed',
      approvedBy: approvedById,
      approvedAt: new Date(),
    };

    const result = await this.collection.insertOne(borrowRecord);
    return { ...borrowRecord, _id: result.insertedId };
  }

  /**
   * Approve borrow request
   */
  async approveRequest(borrowId, approvedById) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(borrowId) },
      {
        $set: {
          status: 'borrowed',
          approvedBy: approvedById,
          approvedAt: new Date(),
          borrowedAt: new Date(),
        },
      }
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      success: result.matchedCount > 0
    };
  }

  /**
   * Reject borrow request
   */
  async rejectRequest(borrowId, approvedById, reason = 'Request rejected') {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(borrowId) },
      {
        $set: {
          status: 'rejected',
          approvedBy: approvedById,
          approvedAt: new Date(),
          rejectionReason: reason,
        },
      }
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      success: result.matchedCount > 0
    };
  }

  /**
   * Return book
   */
  async returnBook(userId, bookId) {
    const borrow = await this.collection.findOne({
      userId,
      bookId,
      status: 'borrowed',
      returnedAt: null,
    });
    
    if (!borrow) return null;

    const fine = this.calculateFine(borrow.dueDate, borrow.userType);
    const now = new Date();

    const result = await this.collection.updateOne(
      { _id: borrow._id },
      { 
        $set: { 
          returnedAt: now, 
          fine,
          status: 'returned' 
        } 
      }
    );

    return {
      success: result.modifiedCount > 0,
      fine,
      borrow,
      daysLate: Math.ceil((now - new Date(borrow.dueDate)) / (1000 * 60 * 60 * 24)),
      gracePeriod: borrow.userType === 'teacher' ? 2 : 1
    };
  }

  /**
   * Delete borrow record
   */
  async deleteBorrow(id) {
    if (!ObjectId.isValid(id)) {
      return { success: false, error: 'Invalid borrow ID format' };
    }

    const borrow = await this.collection.findOne({
      _id: new ObjectId(id)
    });
    
    if (!borrow) {
      return { success: false, error: 'Borrow record not found' };
    }

    const result = await this.collection.deleteOne({ 
      _id: new ObjectId(id) 
    });

    return {
      success: result.deletedCount > 0,
      returnedCopy: borrow.status === 'borrowed' && !borrow.returnedAt,
      borrow
    };
  }

  /**
   * Get all borrows with filters
   */
  async getAll({ page = 1, limit = 10, search = '', status, userType }) {
    const query = search
      ? {
          $or: [
            { userId: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { bookId: { $regex: search, $options: 'i' } },
            { bookName: { $regex: search, $options: 'i' } },
            { bookTitle: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    if (status) query.status = status;
    if (userType) query.userType = userType;

    const borrows = await this.collection
      .find(query)
      .sort({ requestedAt: -1, borrowedAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    // Add live fine for borrowed records
    const enriched = borrows.map(b => ({
      ...b,
      fine: b.status === 'borrowed' ? this.calculateFine(b.dueDate, b.userType) : (b.fine || 0),
    }));

    const total = await this.collection.countDocuments(query);

    return {
      borrows: enriched,
      total,
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(total / +limit)
    };
  }

  /**
   * Get user's active borrow
   */
  async getUserActiveBorrow(userId, username) {
    return await this.collection.findOne({
      userId,
      username,
      status: 'borrowed',
      returnedAt: null,
    });
  }

  /**
   * Get user's pending request
   */
  async getUserPendingRequest(userId, username) {
    return await this.collection.findOne({
      userId,
      username,
      status: 'pending',
      returnedAt: null,
    });
  }

  /**
   * Get user's requests (pending and rejected)
   */
  async getUserRequests(userId) {
    return await this.collection
      .find({ 
        userId,
        $or: [
          { status: 'pending' },
          { status: 'rejected' }
        ]
      })
      .sort({ requestedAt: -1 })
      .toArray();
  }

  /**
   * Get user's borrow history
   */
  async getUserHistory(userId, limit = 10) {
    return await this.collection
      .find({ userId })
      .sort({ borrowedAt: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get borrow statistics
   */
  async getStatistics() {
    const totalBorrows = await this.collection.countDocuments();
    const activeBorrows = await this.collection.countDocuments({ 
      status: 'borrowed',
      returnedAt: null 
    });
    const pendingRequests = await this.collection.countDocuments({ 
      status: 'pending' 
    });
    const returnedBooks = await this.collection.countDocuments({ 
      status: 'returned' 
    });
    
    const totalFines = await this.collection.aggregate([
      { $match: { fine: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$fine' } } }
    ]).toArray();

    const byUserType = await this.collection.aggregate([
      { $group: { _id: '$userType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    const byStatus = await this.collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    return {
      totalBorrows,
      activeBorrows,
      pendingRequests,
      returnedBooks,
      totalFines: totalFines[0]?.total || 0,
      byUserType,
      byStatus,
      lastUpdated: new Date()
    };
  }

  /**
   * Get overdue borrows
   */
  async getOverdueBorrows() {
    const now = new Date();
    const borrows = await this.collection
      .find({
        status: 'borrowed',
        returnedAt: null,
        dueDate: { $lt: now }
      })
      .toArray();

    // Calculate fines for each overdue borrow
    const overdue = borrows.map(b => ({
      ...b,
      fine: this.calculateFine(b.dueDate, b.userType),
      daysOverdue: Math.ceil((now - new Date(b.dueDate)) / (1000 * 60 * 60 * 24))
    }));

    return overdue;
  }

  /**
   * Get borrows by date range
   */
  async getBorrowsByDateRange(startDate, endDate, page = 1, limit = 10) {
    const query = {
      borrowedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const borrows = await this.collection
      .find(query)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      borrows,
      total,
      page: +page,
      limit: +limit
    };
  }

  /**
   * Get top borrowers
   */
  async getTopBorrowers(limit = 10) {
    const topBorrowers = await this.collection.aggregate([
      { $group: { 
        _id: { userId: '$userId', username: '$username' },
        totalBorrows: { $sum: 1 },
        totalFines: { $sum: '$fine' }
      }},
      { $sort: { totalBorrows: -1 } },
      { $limit: limit }
    ]).toArray();

    return topBorrowers;
  }

  /**
   * Get fine policy for user type
   */
  getFinePolicy(userType) {
    return {
      userType: userType || 'student',
      gracePeriod: userType === 'teacher' ? 2 : 1,
      finePerDay: 10,
      description: userType === 'teacher' 
        ? '2 days grace period, then 10 ETB per day' 
        : '1 day grace period, then 10 ETB per day'
    };
  }
}

/**
 * Initialize and export the BorrowModel instance
 */
export function initBorrowModel(db) {
  return new BorrowModel(db);
}

/**
 * Default export for convenience
 */
export default BorrowModel;