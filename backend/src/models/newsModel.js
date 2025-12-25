// models/newsModel.js
import { v4 as uuidv4 } from 'uuid';

/**
 * News Model
 * Contains all database queries for news operations
 * This follows the same structure as your existing code
 */
export class NewsModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('news');
  }

  /**
   * Helper: Generate unique news ID
   */
  generateId() {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const r = uuidv4().slice(0, 8).toUpperCase();
    return `N-${d}-${r}`;
  }

  /**
   * Create new news post
   */
  async create(role, news, createdBy = null) {
    if (!role || !news || news.trim().length < 5) {
      throw new Error('Role and news (min 5 chars) required');
    }

    const newsData = {
      id: this.generateId(),
      role: role === 'all' ? ['librarian', 'teacher', 'student'] : [role],
      news: news.trim(),
      createdAt: new Date(),
      readBy: [],
      createdBy: createdBy || null,
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(newsData);
    return { ...newsData, _id: result.insertedId };
  }

  /**
   * Get news with pagination, role filter, and search
   */
  async getByRole(role, { page = 1, limit = 10, search = '' }) {
    const query = {
      role: { $in: [role] }
    };

    if (search) {
      query.news = { $regex: search, $options: 'i' };
    }

    const news = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      news,
      total,
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(total / +limit)
    };
  }

  /**
   * Get unread news count for user
   */
  async getUnreadCount(role, userId) {
    if (!role || !userId) {
      throw new Error('role and userId required');
    }

    return await this.collection.countDocuments({
      role: { $in: [role] },
      readBy: { $nin: [userId] },
    });
  }

  /**
   * Mark news as read for user
   */
  async markAsRead(userId) {
    if (!userId) {
      throw new Error('userId required');
    }

    const result = await this.collection.updateMany(
      { readBy: { $nin: [userId] } },
      { $addToSet: { readBy: userId } }
    );

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      success: result.modifiedCount > 0
    };
  }

  /**
   * Mark specific news as read for user
   */
  async markNewsAsRead(newsId, userId) {
    const result = await this.collection.updateOne(
      { id: newsId },
      { $addToSet: { readBy: userId } }
    );

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      success: result.matchedCount > 0
    };
  }

  /**
   * Get all news (admin only)
   */
  async getAll({ page = 1, limit = 10, search = '', roleFilter = '' }) {
    const query = {};

    if (search) {
      query.$or = [
        { news: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } }
      ];
    }

    if (roleFilter) {
      query.role = { $in: [roleFilter] };
    }

    const news = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      news,
      total,
      page: +page,
      limit: +limit
    };
  }

  /**
   * Get news by ID
   */
  async getById(newsId) {
    return await this.collection.findOne({ id: newsId });
  }

  /**
   * Update news
   */
  async update(newsId, updateData) {
    const result = await this.collection.updateOne(
      { id: newsId },
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

  /**
   * Delete news
   */
  async delete(newsId) {
    const result = await this.collection.deleteOne({ id: newsId });

    return {
      deletedCount: result.deletedCount,
      success: result.deletedCount > 0
    };
  }

  /**
   * Get news statistics
   */
  async getStatistics() {
    const totalNews = await this.collection.countDocuments();
    
    const byRole = await this.collection.aggregate([
      { $unwind: '$role' },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    const dailyStats = await this.collection.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]).toArray();

    const recentNews = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Get total unique readers
    const allNews = await this.collection.find({}).toArray();
    const uniqueReaders = new Set();
    allNews.forEach(item => {
      if (item.readBy && Array.isArray(item.readBy)) {
        item.readBy.forEach(reader => uniqueReaders.add(reader));
      }
    });

    return {
      totalNews,
      byRole,
      dailyStats,
      recentNews,
      totalReaders: uniqueReaders.size,
      lastUpdated: new Date()
    };
  }

  /**
   * Get news for multiple roles
   */
  async getForRoles(roles, page = 1, limit = 10) {
    const query = {
      role: { $in: roles }
    };

    const news = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      news,
      total,
      page: +page,
      limit: +limit
    };
  }

  /**
   * Search news with advanced filters
   */
  async searchNews(searchTerm, filters = {}, page = 1, limit = 10) {
    const query = {};

    // Text search
    if (searchTerm) {
      query.$or = [
        { news: { $regex: searchTerm, $options: 'i' } },
        { id: { $regex: searchTerm, $options: 'i' } },
        { createdBy: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Role filter
    if (filters.role && filters.role !== 'all') {
      query.role = { $in: [filters.role] };
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    // Read status filter (requires userId)
    if (filters.userId && filters.readStatus !== undefined) {
      if (filters.readStatus) {
        query.readBy = { $in: [filters.userId] };
      } else {
        query.readBy = { $nin: [filters.userId] };
      }
    }

    const news = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      news,
      total,
      page: +page,
      limit: +limit,
      filters
    };
  }

  /**
   * Get popular news (most read)
   */
  async getPopularNews(limit = 10) {
    const news = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(100) // Get recent news first
      .toArray();

    // Sort by number of readers
    const sortedNews = news.sort((a, b) => {
      const aReaders = a.readBy ? a.readBy.length : 0;
      const bReaders = b.readBy ? b.readBy.length : 0;
      return bReaders - aReaders;
    });

    return sortedNews.slice(0, limit);
  }

  /**
   * Get news by creator
   */
  async getByCreator(createdBy, page = 1, limit = 10) {
    const query = { createdBy };

    const news = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      news,
      total,
      page: +page,
      limit: +limit
    };
  }

  /**
   * Bulk update news
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
   * Get news count by date range
   */
  async getCountByDateRange(startDate, endDate) {
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const total = await this.collection.countDocuments(query);
    const byRole = await this.collection.aggregate([
      { $match: query },
      { $unwind: '$role' },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    return {
      total,
      byRole,
      startDate,
      endDate
    };
  }
}

/**
 * Initialize and export the NewsModel instance
 */
export function initNewsModel(db) {
  return new NewsModel(db);
}

/**
 * Default export for convenience
 */
export default NewsModel;