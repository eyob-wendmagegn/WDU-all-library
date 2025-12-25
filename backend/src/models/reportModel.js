// models/reportModel.js
import { connectDB } from '../config/db.js';

/**
 * Report Model
 * Contains all database queries for report operations
 * This follows the same structure as your existing code
 */
export class ReportModel {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get weekly report by type
   */
  async getWeeklyReport(type) {
    // ---- 1 week ago (00:00) -------------------------------------------------
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // ---- Base filter ---------------------------------------------------------
    const filter = { createdAt: { $gte: weekAgo } };

    // ---- 1. Users ------------------------------------------------------------
    if (type === 'users') {
      const added = await this.db.collection('users')
        .find({ ...filter, role: { $ne: 'admin' } })
        .project({ password: 0, _id: 0 })
        .toArray();

      const deactivated = await this.db.collection('users')
        .find({ ...filter, status: 'deactive', role: { $ne: 'admin' } })
        .project({ password: 0, _id: 0 })
        .toArray();

      return { added, deactivated };
    }

    // ---- 2. News -------------------------------------------------------------
    if (type === 'news') {
      const added = await this.db.collection('news')
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      return { added };
    }

    // ---- 3. Books ------------------------------------------------------------
    if (type === 'books') {
      const added = await this.db.collection('books')
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      return { added };
    }

    // ---- 4. Deactive users (FIXED: Show users DEACTIVATED this week) -------------
    if (type === 'deactive') {
      // FIX: Get all deactivated users and filter by when they were deactivated
      // First, try to find by deactivatedAt field
      let deactivated = await this.db.collection('users')
        .find({ 
          status: 'deactive',
          role: { $ne: 'admin' }
        })
        .project({ password: 0, _id: 0 })
        .toArray();

      // Filter in JavaScript to show only users deactivated this week
      const recentDeactivated = deactivated.filter(user => {
        // Check if user has deactivatedAt field and it's within this week
        if (user.deactivatedAt && new Date(user.deactivatedAt) >= weekAgo) {
          return true;
        }
        
        // Check if user has updatedAt field and it's within this week (status change)
        if (user.updatedAt && new Date(user.updatedAt) >= weekAgo) {
          return true;
        }
        
        // Fallback: User was created this week AND is deactivated
        if (user.createdAt && new Date(user.createdAt) >= weekAgo) {
          return true;
        }
        
        return false;
      });

      return { deactivated: recentDeactivated };
    }

    throw new Error('Invalid report type');
  }

  /**
   * Get daily report for any collection
   */
  async getDailyReport(collectionName, days = 7) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    daysAgo.setHours(0, 0, 0, 0);

    const data = await this.db.collection(collectionName)
      .find({ createdAt: { $gte: daysAgo } })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      collection: collectionName,
      period: `${days} days`,
      count: data.length,
      data
    };
  }

  /**
   * Get report by date range
   */
  async getReportByDateRange(collectionName, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const data = await this.db.collection(collectionName)
      .find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      collection: collectionName,
      period: { startDate, endDate },
      count: data.length,
      data
    };
  }

  /**
   * Get user growth report
   */
  async getUserGrowthReport(weeks = 4) {
    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7));
    weeksAgo.setHours(0, 0, 0, 0);

    const result = await this.db.collection('users').aggregate([
      { $match: { createdAt: { $gte: weeksAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          },
          count: { $sum: 1 },
          users: { 
            $push: {
              id: '$id',
              name: '$name',
              username: '$username',
              role: '$role',
              createdAt: '$createdAt'
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]).toArray();

    return {
      period: `${weeks} weeks`,
      totalWeeks: result.length,
      data: result
    };
  }

  /**
   * Get book borrowing statistics
   */
  async getBorrowingStats(days = 30) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    daysAgo.setHours(0, 0, 0, 0);

    const borrows = await this.db.collection('borrows')
      .find({ borrowedAt: { $gte: daysAgo } })
      .sort({ borrowedAt: -1 })
      .toArray();

    const returns = borrows.filter(b => b.returnedAt);
    const overdue = borrows.filter(b => 
      !b.returnedAt && new Date(b.dueDate) < new Date()
    );

    return {
      period: `${days} days`,
      totalBorrows: borrows.length,
      returns: returns.length,
      overdue: overdue.length,
      borrows,
      returnsData: returns,
      overdueData: overdue
    };
  }

  /**
   * Get system activity report
   */
  async getSystemActivityReport(days = 7) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    daysAgo.setHours(0, 0, 0, 0);

    const collections = ['users', 'books', 'borrows', 'news', 'comments', 'payments'];
    const report = {};

    for (const collection of collections) {
      try {
        const count = await this.db.collection(collection).countDocuments({
          createdAt: { $gte: daysAgo }
        });
        report[collection] = count;
      } catch (error) {
        report[collection] = 0; // Collection might not exist
      }
    }

    return {
      period: `${days} days`,
      startDate: daysAgo,
      endDate: new Date(),
      activity: report,
      totalActivity: Object.values(report).reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Get user activity report
   */
  async getUserActivityReport(userId, days = 30) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    daysAgo.setHours(0, 0, 0, 0);

    // Get user's borrows
    const borrows = await this.db.collection('borrows')
      .find({ 
        userId,
        borrowedAt: { $gte: daysAgo }
      })
      .sort({ borrowedAt: -1 })
      .toArray();

    // Get user's comments
    const comments = await this.db.collection('comments')
      .find({ 
        userId,
        createdAt: { $gte: daysAgo }
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Get user's payments
    const payments = await this.db.collection('payments')
      .find({ 
        userId,
        createdAt: { $gte: daysAgo }
      })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      userId,
      period: `${days} days`,
      borrows: {
        count: borrows.length,
        data: borrows
      },
      comments: {
        count: comments.length,
        data: comments
      },
      payments: {
        count: payments.length,
        data: payments
      },
      totalActivity: borrows.length + comments.length + payments.length
    };
  }

  /**
   * Get monthly summary report
   */
  async getMonthlySummaryReport(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    // User statistics
    const newUsers = await this.db.collection('users').countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      role: { $ne: 'admin' }
    });

    const activeUsers = await this.db.collection('users').countDocuments({
      status: 'active',
      role: { $ne: 'admin' }
    });

    // Book statistics
    const newBooks = await this.db.collection('books').countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalBooks = await this.db.collection('books').countDocuments();

    // Borrowing statistics
    const newBorrows = await this.db.collection('borrows').countDocuments({
      borrowedAt: { $gte: startDate, $lte: endDate }
    });

    const returns = await this.db.collection('borrows').countDocuments({
      returnedAt: { $gte: startDate, $lte: endDate }
    });

    // Payment statistics
    const payments = await this.db.collection('payments').aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();

    const totalRevenue = payments[0]?.total || 0;

    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      users: {
        newUsers,
        activeUsers,
        deactiveUsers: await this.db.collection('users').countDocuments({
          status: 'deactive',
          role: { $ne: 'admin' }
        })
      },
      books: {
        newBooks,
        totalBooks,
        availableBooks: await this.db.collection('books').countDocuments({ copies: { $gt: 0 } })
      },
      borrowing: {
        newBorrows,
        returns,
        activeBorrows: await this.db.collection('borrows').countDocuments({
          returnedAt: null,
          status: 'borrowed'
        })
      },
      financial: {
        totalRevenue,
        transactions: await this.db.collection('payments').countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        })
      },
      startDate,
      endDate
    };
  }

  /**
   * Export report data
   */
  async exportReport(type, format = 'json', options = {}) {
    let data;
    
    switch (type) {
      case 'weekly':
        data = await this.getWeeklyReport(options.reportType || 'users');
        break;
      case 'monthly':
        const now = new Date();
        data = await this.getMonthlySummaryReport(now.getFullYear(), now.getMonth() + 1);
        break;
      case 'custom':
        if (!options.collection || !options.startDate || !options.endDate) {
          throw new Error('Collection, startDate, and endDate are required for custom reports');
        }
        data = await this.getReportByDateRange(
          options.collection,
          options.startDate,
          options.endDate
        );
        break;
      default:
        throw new Error('Invalid export type');
    }

    if (format === 'json') {
      return {
        format: 'json',
        type,
        generatedAt: new Date(),
        data
      };
    } else if (format === 'csv') {
      // Basic CSV conversion (you might want to implement proper CSV formatting)
      return {
        format: 'csv',
        type,
        generatedAt: new Date(),
        data: JSON.stringify(data)
      };
    }

    throw new Error(`Format '${format}' not supported`);
  }
}

/**
 * Initialize and export the ReportModel instance
 */
export function initReportModel(db) {
  return new ReportModel(db);
}

// ============================================================
// KEEP THESE FUNCTIONS FOR BACKWARD COMPATIBILITY
// ============================================================

/**
 * Legacy function - keep for backward compatibility
 * This is what your reportController.js imports
 */
export const getWeeklyReport = async (type) => {
  const db = await connectDB();
  const model = new ReportModel(db);
  return await model.getWeeklyReport(type);
};

/**
 * Default export for convenience
 */
export default ReportModel;