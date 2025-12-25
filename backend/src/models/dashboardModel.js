// models/dashboardModel.js

/**
 * Dashboard Model
 * Contains all database queries for dashboard statistics
 * This follows the same structure as your existing code
 */
export class DashboardModel {
  constructor(db) {
    this.db = db;
  }

  /**
   * Helper: Get current week number
   */
  getCurrentWeek() {
    Date.prototype.getWeek = function () {
      const date = new Date(this.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };
    return new Date().getWeek();
  }

  /**
   * Helper: Calculate fine (10 ETB per day after due)
   */
  calculateFine(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const msDiff = now - due;
    const daysLate = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    return daysLate * 10;
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Get total books count
   */
  async getTotalBooks() {
    return await this.db.collection('books').countDocuments();
  }

  /**
   * Get user counts by status
   */
  async getUserCountsByStatus() {
    const activeUsers = await this.db.collection('users').countDocuments({ status: 'active' });
    const deactiveUsers = await this.db.collection('users').countDocuments({ status: 'deactive' });
    const totalUsers = await this.db.collection('users').countDocuments();
    
    return {
      totalUsers,
      activeUsers,
      deactiveUsers
    };
  }

  /**
   * Get total news posts
   */
  async getTotalPosts() {
    return await this.db.collection('news').countDocuments();
  }

  /**
   * Get total reports
   */
  async getTotalReports() {
    return await this.db.collection('reports').countDocuments();
  }

  /**
   * Get user growth by week for last 6 weeks
   */
  async getUserGrowth(sixWeeksAgo) {
    return await this.db.collection('users').aggregate([
      { $match: { createdAt: { $gte: sixWeeksAgo } } },
      { 
        $group: { 
          _id: { 
            $week: { 
              date: '$createdAt',
              timezone: 'UTC'
            } 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]).toArray();
  }

  /**
   * Get post activity for last 4 weeks
   */
  async getPostActivity(fourWeeksAgo) {
    return await this.db.collection('news').aggregate([
      { $match: { createdAt: { $gte: fourWeeksAgo } } },
      { 
        $group: { 
          _id: { 
            $week: { 
              date: '$createdAt',
              timezone: 'UTC'
            } 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]).toArray();
  }

  /**
   * Get recent users (non-admin)
   */
  async getRecentUsers(limit = 5) {
    return await this.db.collection('users')
      .find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .project({ name: 1, username: 1, createdAt: 1, _id: 0 })
      .toArray();
  }

  // ==================== LIBRARIAN METHODS ====================

  /**
   * Get borrow counts
   */
  async getBorrowCounts() {
    const borrowedBooks = await this.db.collection('borrows').countDocuments({ returnedAt: null });
    const returnedBooks = await this.db.collection('borrows').countDocuments({ returnedAt: { $ne: null } });
    
    return {
      borrowedBooks,
      returnedBooks
    };
  }

  /**
   * Get total fines paid
   */
  async getTotalFinesPaid() {
    const result = await this.db.collection('borrows').aggregate([
      { $match: { returnedAt: { $ne: null }, fine: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$fine' } } }
    ]).toArray();

    return result[0]?.total || 0;
  }

  /**
   * Get returns by day for last 7 days
   */
  async getReturnsByDay(sevenDaysAgo) {
    return await this.db.collection('borrows').aggregate([
      { $match: { returnedAt: { $gte: sevenDaysAgo, $ne: null } } },
      { $group: { _id: { $dayOfWeek: '$returnedAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
  }

  /**
   * Get books added per day for last 7 days
   */
  async getBooksAddedPerDay(sevenDaysAgo) {
    return await this.db.collection('books').aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
  }

  /**
   * Get borrow trend for last 4 weeks
   */
  async getBorrowTrend(fourWeeksAgo) {
    return await this.db.collection('borrows').aggregate([
      { $match: { borrowedAt: { $gte: fourWeeksAgo } } },
      { $group: { _id: { $week: { date: '$borrowedAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
  }

  /**
   * Get recent library activity
   */
  async getRecentLibraryActivity(limit = 5) {
    return await this.db.collection('borrows')
      .find({})
      .sort({ borrowedAt: -1 })
      .limit(limit)
      .project({ userId: 1, bookId: 1, borrowedAt: 1, returnedAt: 1, fine: 1, _id: 0 })
      .toArray();
  }

  /**
   * Get user details by ID
   */
  async getUserDetails(userId) {
    return await this.db.collection('users').findOne(
      { id: userId },
      { projection: { name: 1 } }
    );
  }

  /**
   * Get book details by ID
   */
  async getBookDetails(bookId) {
    return await this.db.collection('books').findOne(
      { id: bookId },
      { projection: { title: 1 } }
    );
  }

  // ==================== TEACHER METHODS ====================

  /**
   * Get teacher's added books count
   */
  async getTeacherAddedBooksCount(teacherId) {
    return await this.db.collection('books').countDocuments({ addedBy: teacherId });
  }

  /**
   * Get teacher's borrow counts
   */
  async getTeacherBorrowCounts(teacherId) {
    const borrowedBooks = await this.db.collection('borrows').countDocuments({ 
      userId: teacherId, 
      returnedAt: null 
    });
    
    const returnedBooks = await this.db.collection('borrows').countDocuments({ 
      userId: teacherId, 
      returnedAt: { $ne: null } 
    });
    
    return {
      borrowedBooks,
      returnedBooks
    };
  }

  /**
   * Get teacher's books added per day
   */
  async getTeacherBooksAddedPerDay(teacherId, sevenDaysAgo) {
    return await this.db.collection('books').aggregate([
      { 
        $match: { 
          addedBy: teacherId, 
          createdAt: { $gte: sevenDaysAgo } 
        } 
      },
      { 
        $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]).toArray();
  }

  /**
   * Get teacher's borrow trend
   */
  async getTeacherBorrowTrend(teacherId, fourWeeksAgo) {
    return await this.db.collection('borrows').aggregate([
      { 
        $match: { 
          userId: teacherId, 
          borrowedAt: { $gte: fourWeeksAgo } 
        } 
      },
      { 
        $group: { 
          _id: { $week: { date: '$borrowedAt', timezone: 'UTC' } }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]).toArray();
  }

  /**
   * Get teacher's recent added books
   */
  async getTeacherRecentAddedBooks(teacherId, limit = 10) {
    return await this.db.collection('books')
      .find({ addedBy: teacherId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .project({ title: 1, createdAt: 1, _id: 0 })
      .toArray();
  }

  /**
   * Get teacher's recent borrows
   */
  async getTeacherRecentBorrows(teacherId, limit = 10) {
    return await this.db.collection('borrows')
      .find({ userId: teacherId })
      .sort({ borrowedAt: -1 })
      .limit(limit)
      .project({ bookId: 1, borrowedAt: 1, returnedAt: 1, _id: 0 })
      .toArray();
  }

  /**
   * Get books by multiple IDs
   */
  async getBooksByIds(bookIds) {
    return await this.db.collection('books')
      .find({ id: { $in: bookIds } })
      .project({ id: 1, title: 1, _id: 0 })
      .toArray();
  }

  // ==================== STUDENT METHODS ====================

  /**
   * Get student's total borrowed books
   */
  async getStudentTotalBorrowed(studentId) {
    return await this.db.collection('borrows').countDocuments({ userId: studentId });
  }

  /**
   * Get student's current borrows
   */
  async getStudentCurrentBorrows(studentId) {
    return await this.db.collection('borrows')
      .find({ userId: studentId, returnedAt: null })
      .sort({ borrowedAt: -1 })
      .toArray();
  }

  /**
   * Get student's borrow history
   */
  async getStudentBorrowHistory(studentId, limit = 10) {
    return await this.db.collection('borrows')
      .find({ userId: studentId })
      .sort({ borrowedAt: -1 })
      .limit(limit)
      .toArray();
  }

  // ==================== COMMON METHODS ====================

  /**
   * Get all collections counts for admin
   */
  async getAllCollectionsCount() {
    const collections = ['users', 'books', 'borrows', 'news', 'reports', 'payments', 'comments'];
    const counts = {};
    
    for (const collection of collections) {
      try {
        counts[collection] = await this.db.collection(collection).countDocuments();
      } catch (error) {
        counts[collection] = 0; // Collection might not exist
      }
    }
    
    return counts;
  }

  /**
   * Get daily activity for any collection
   */
  async getDailyActivity(collectionName, dateField, days = 7) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return await this.db.collection(collectionName).aggregate([
      { $match: { [dateField]: { $gte: daysAgo } } },
      { 
        $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]).toArray();
  }

  /**
   * Get weekly activity for any collection
   */
  async getWeeklyActivity(collectionName, dateField, weeks = 4) {
    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7));
    
    return await this.db.collection(collectionName).aggregate([
      { $match: { [dateField]: { $gte: weeksAgo } } },
      { 
        $group: { 
          _id: { $week: { date: `$${dateField}`, timezone: 'UTC' } }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]).toArray();
  }

  /**
   * Get top N items from collection
   */
  async getTopItems(collectionName, sortField, limit = 10, projection = {}) {
    return await this.db.collection(collectionName)
      .find({})
      .sort({ [sortField]: -1 })
      .limit(limit)
      .project(projection)
      .toArray();
  }

  /**
   * Get counts grouped by field
   */
  async getCountsByField(collectionName, fieldName) {
    return await this.db.collection(collectionName).aggregate([
      { $group: { _id: `$${fieldName}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
  }

  /**
   * Get recent items with related data
   */
  async getRecentWithRelations(mainCollection, lookupCollections, limit = 10) {
    const recentItems = await this.db.collection(mainCollection)
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    // This is a simplified version - in real implementation you'd join data
    return recentItems;
  }
}

/**
 * Initialize and export the DashboardModel instance
 */
export function initDashboardModel(db) {
  return new DashboardModel(db);
}

/**
 * Default export for convenience
 */
export default DashboardModel;