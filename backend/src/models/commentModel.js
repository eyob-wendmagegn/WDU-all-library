// models/commentModel.js
import { v4 as uuidv4 } from 'uuid';

/**
 * Comment Model
 * Contains all database queries for comment operations
 * This follows the same structure as your existing code
 */
export class CommentModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('comments');
  }

  /**
   * Helper: Generate unique comment ID
   */
  generateId() {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const r = uuidv4().slice(0, 8).toUpperCase();
    return `C-${d}-${r}`;
  }

  /**
   * Create new comment
   */
  async create(userId, username, comment, userRole) {
    if (!userId || !username || !comment) {
      throw new Error('All fields required');
    }

    const newComment = {
      id: this.generateId(),
      userId,
      username,
      role: userRole,
      comment,
      createdAt: new Date(),
      readByAdmin: false, // ← UNREAD
    };

    const result = await this.collection.insertOne(newComment);
    return { ...newComment, _id: result.insertedId };
  }

  /**
   * Get all comments with pagination and search
   */
  async getAll({ page = 1, limit = 10, search = '' }) {
    const query = search
      ? {
          $or: [
            { userId: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { comment: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const comments = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get unread comments count
   */
  async getUnreadCount() {
    return await this.collection.countDocuments({ readByAdmin: false });
  }

  /**
   * Mark all comments as read
   */
  async markAllAsRead() {
    const result = await this.collection.updateMany(
      { readByAdmin: false },
      { $set: { readByAdmin: true } }
    );

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      success: result.modifiedCount > 0
    };
  }

  /**
   * Mark specific comment as read
   */
  async markAsRead(commentId) {
    const result = await this.collection.updateOne(
      { id: commentId },
      { $set: { readByAdmin: true } }
    );

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      success: result.matchedCount > 0
    };
  }

  /**
   * Get comments by user ID
   */
  async getByUser(userId, page = 1, limit = 10) {
    const query = { userId };

    const comments = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      comments,
      total,
      page,
      limit
    };
  }

  /**
   * Get comments by username
   */
  async getByUsername(username, page = 1, limit = 10) {
    const query = { username };

    const comments = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      comments,
      total,
      page,
      limit
    };
  }

  /**
   * Get comments by role
   */
  async getByRole(role, page = 1, limit = 10) {
    const query = { role };

    const comments = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      comments,
      total,
      page,
      limit
    };
  }

  /**
   * Delete comment by ID
   */
  async deleteById(commentId) {
    const result = await this.collection.deleteOne({ id: commentId });

    return {
      deletedCount: result.deletedCount,
      success: result.deletedCount > 0
    };
  }

  /**
   * Get comment statistics
   */
  async getStatistics() {
    const totalComments = await this.collection.countDocuments();
    const unreadComments = await this.collection.countDocuments({ readByAdmin: false });
    const readComments = totalComments - unreadComments;

    const byRole = await this.collection.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    const dailyStats = await this.collection.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$readByAdmin', false] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]).toArray();

    const recentComments = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return {
      totalComments,
      unreadComments,
      readComments,
      byRole,
      dailyStats,
      recentComments,
      lastUpdated: new Date()
    };
  }

  /**
   * Search comments with advanced filters
   */
  async searchComments(searchTerm, filters = {}, page = 1, limit = 10) {
    const query = {};

    // Text search
    if (searchTerm) {
      query.$or = [
        { userId: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { comment: { $regex: searchTerm, $options: 'i' } },
        { role: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Additional filters
    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.readStatus !== undefined) {
      query.readByAdmin = filters.readStatus;
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

    const comments = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      comments,
      total,
      page,
      limit,
      filters
    };
  }

  /**
   * Get comments count by date range
   */
  async getCountByDateRange(startDate, endDate) {
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const total = await this.collection.countDocuments(query);
    const unread = await this.collection.countDocuments({
      ...query,
      readByAdmin: false
    });

    return {
      total,
      unread,
      read: total - unread,
      startDate,
      endDate
    };
  }

  /**
   * Bulk update comments
   */
  async bulkUpdate(updates) {
    const bulkOperations = updates.map(update => ({
      updateOne: {
        filter: { id: update.id },
        update: { $set: update.data }
      }
    }));

    if (bulkOperations.length === 0) {
      return { modifiedCount: 0 };
    }

    const result = await this.collection.bulkWrite(bulkOperations);
    return result;
  }

  /**
   * Get comment by ID
   */
  async getById(commentId) {
    return await this.collection.findOne({ id: commentId });
  }

  /**
   * Update comment
   */
  async updateComment(commentId, updateData) {
    const result = await this.collection.updateOne(
      { id: commentId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      success: result.matchedCount > 0
    };
  }
}

/**
 * Initialize and export the CommentModel instance
 */
export function initCommentModel(db) {
  return new CommentModel(db);
}

/**
 * Default export for convenience
 */
export default CommentModel;