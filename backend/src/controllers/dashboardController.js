// src/controllers/dashboardController.js
import { connectDB } from '../config/db.js';

// Helper: ISO Week
Date.prototype.getWeek = function () {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

// Helper: Calculate fine (10 ETB per day after due)
const calculateFine = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const msDiff = now - due;
  const daysLate = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
  return daysLate * 10;
};

export const getDashboardStats = async (req, res) => {
  try {
    const db = await connectDB();
    const user = req.user;

    const totalBooks = await db.collection('books').countDocuments();

    // === ADMIN STATS ===
    let adminStats = null;
    if (user.role === 'admin') {
      const activeUsers = await db.collection('users').countDocuments({ status: 'active' });
      const deactiveUsers = await db.collection('users').countDocuments({ status: 'deactive' });
      const totalPosts = await db.collection('news').countDocuments();
      
      // Count documents in 'reports' collection. 
      // If collection doesn't exist or is empty, it returns 0, which is correct if no reports have been created.
      const totalReports = await db.collection('reports').countDocuments();

      // FIXED: Get data for the last 6 weeks (42 days) for user growth
      const sixWeeksAgo = new Date();
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42); // 6 weeks * 7 days = 42 days
      
      // Get user growth by week
      const userGrowth = await db.collection('users').aggregate([
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

      // Get current week number
      const currentWeek = new Date().getWeek();
      
      // Create labels for 6 weeks: Week 1, Week 2, ..., Week 6
      const weekLabels = Array(6).fill(0).map((_, i) => `Week ${i + 1}`);
      
      // Map data to week labels
      const growthData = Array(6).fill(0).map((_, i) => {
        // Calculate which week number we're looking for (going back from current week)
        const targetWeek = currentWeek - (5 - i);
        const foundWeek = userGrowth.find(g => g._id === targetWeek);
        return foundWeek ? foundWeek.count : 0;
      });

      // Get post activity for last 4 weeks
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const postActivity = await db.collection('news').aggregate([
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

      // Create post activity data for 4 weeks
      const activityLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const activityData = Array(4).fill(0).map((_, i) => {
        const targetWeek = currentWeek - (3 - i);
        const foundWeek = postActivity.find(p => p._id === targetWeek);
        return foundWeek ? foundWeek.count : 0;
      });

      // Get recent users
      const recentUsers = await db.collection('users')
        .find({ role: { $ne: 'admin' } })
        .sort({ createdAt: -1 })
        .limit(5)
        .project({ name: 1, username: 1, createdAt: 1, _id: 0 })
        .toArray();

      adminStats = {
        totals: { 
          users: await db.collection('users').countDocuments(), 
          activeUsers, 
          deactiveUsers, 
          books: totalBooks, 
          posts: totalPosts, 
          reports: totalReports 
        },
        charts: { 
          // FIXED: Now using weekLabels instead of months
          userGrowth: { labels: weekLabels, data: growthData },
          postActivity: { labels: activityLabels, data: activityData } 
        },
        recentUsers
      };
    }

    // === LIBRARIAN STATS ===
    let librarianStats = null;
    if (['librarian', 'admin'].includes(user.role)) {
      const borrowedBooks = await db.collection('borrows').countDocuments({ returnedAt: null });
      const returnedBooks = await db.collection('borrows').countDocuments({ returnedAt: { $ne: null } });
      const totalPaid = await db.collection('borrows').aggregate([
        { $match: { returnedAt: { $ne: null }, fine: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$fine' } } }
      ]).toArray();

      const availableBooks = totalBooks - borrowedBooks;
      const totalFine = totalPaid[0]?.total || 0;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const returnsByDay = await db.collection('borrows').aggregate([
        { $match: { returnedAt: { $gte: sevenDaysAgo, $ne: null } } },
        { $group: { _id: { $dayOfWeek: '$returnedAt' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray();

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const returnData = days.map((_, i) => {
        const mongoDay = i === 6 ? 1 : i + 2;
        return returnsByDay.find(r => r._id === mongoDay)?.count || 0;
      });

      const booksAddedRaw = await db.collection('books').aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray();

      const last7Days = Array(7).fill(0).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const str = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en', { weekday: 'short' });
        const found = booksAddedRaw.find(b => b._id === str);
        return { label, value: found?.count || 0 };
      });

      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const borrowTrend = await db.collection('borrows').aggregate([
        { $match: { borrowedAt: { $gte: fourWeeksAgo } } },
        { $group: { _id: { $week: { date: '$borrowedAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray();

      const currentWeek = new Date().getWeek();
      const borrowData = Array(4).fill(0).map((_, i) => {
        const week = currentWeek - (3 - i);
        return borrowTrend.find(b => b._id === week)?.count || 0;
      });

      const recentRaw = await db.collection('borrows')
        .find({})
        .sort({ borrowedAt: -1 })
        .limit(5)
        .project({ userId: 1, bookId: 1, borrowedAt: 1, returnedAt: 1, fine: 1, _id: 0 })
        .toArray();

      const recentActivity = [];
      for (const act of recentRaw) {
        const [userDoc, bookDoc] = await Promise.all([
          db.collection('users').findOne({ id: act.userId }, { projection: { name: 1 } }),
          db.collection('books').findOne({ id: act.bookId }, { projection: { title: 1 } })
        ]);
        if (userDoc && bookDoc) {
          recentActivity.push({
            action: act.returnedAt ? 'Returned' : 'Borrowed',
            user: userDoc.name || 'Unknown',
            book: bookDoc.title || 'Unknown',
            date: new Date(act.borrowedAt).toLocaleDateString(),
            fine: act.fine || 0
          });
        }
      }

      librarianStats = {
        totals: { books: totalBooks, borrowed: borrowedBooks, returned: returnedBooks, paid: totalFine },
        pie: { borrowed: borrowedBooks, available: availableBooks },
        returns: { labels: days, data: returnData },
        added: { labels: last7Days.map(d => d.label), data: last7Days.map(d => d.value) },
        borrowedTrend: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], data: borrowData },
        recentActivity
      };
    }

    // === TEACHER STATS – PERSONAL ONLY ===
    let teacherStats = null;
    if (user.role === 'teacher') {
      const addedBooks = await db.collection('books').countDocuments({ addedBy: user.id });
      const borrowedBooks = await db.collection('borrows').countDocuments({ userId: user.id, returnedAt: null });
      const returnedBooks = await db.collection('borrows').countDocuments({ userId: user.id, returnedAt: { $ne: null } });

      // Books Added (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const booksAddedRaw = await db.collection('books').aggregate([
        { $match: { addedBy: user.id, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray();

      const last7Days = Array(7).fill(0).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const str = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en', { weekday: 'short' });
        const found = booksAddedRaw.find(b => b._id === str);
        return { label, value: found?.count || 0 };
      });

      // Borrowed Trend (last 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const borrowTrend = await db.collection('borrows').aggregate([
        { $match: { userId: user.id, borrowedAt: { $gte: fourWeeksAgo } } },
        { $group: { _id: { $week: { date: '$borrowedAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray();

      const currentWeek = new Date().getWeek();
      const borrowData = Array(4).fill(0).map((_, i) => {
        const week = currentWeek - (3 - i);
        return borrowTrend.find(b => b._id === week)?.count || 0;
      });

      // Recent Activity: Added + Borrowed + Returned
      const [addedRaw, borrowRaw] = await Promise.all([
        db.collection('books').find({ addedBy: user.id }).sort({ createdAt: -1 }).limit(10).project({ title: 1, createdAt: 1, _id: 0 }).toArray(),
        db.collection('borrows').find({ userId: user.id }).sort({ borrowedAt: -1 }).limit(10).project({ bookId: 1, borrowedAt: 1, returnedAt: 1, _id: 0 }).toArray()
      ]);

      const bookIds = [...new Set(borrowRaw.map(b => b.bookId))];
      const books = await db.collection('books').find({ id: { $in: bookIds } }).project({ id: 1, title: 1, _id: 0 }).toArray();
      const bookMap = Object.fromEntries(books.map(b => [b.id, b.title]));

      const recentActivity = [];

      addedRaw.forEach(b => {
        recentActivity.push({
          action: 'Added',
          book: b.title,
          date: new Date(b.createdAt).toLocaleDateString(),
          type: 'add'
        });
      });

      borrowRaw.forEach(b => {
        const title = bookMap[b.bookId] || 'Unknown Book';
        if (b.returnedAt) {
          recentActivity.push({
            action: 'Returned',
            book: title,
            date: new Date(b.returnedAt).toLocaleDateString(),
            type: 'return'
          });
        } else {
          recentActivity.push({
            action: 'Borrowed',
            book: title,
            date: new Date(b.borrowedAt).toLocaleDateString(),
            type: 'borrow'
          });
        }
      });

      recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
      const limitedActivity = recentActivity.slice(0, 5);

      teacherStats = {
        totals: { addedBooks, borrowedBooks, returnedBooks },
        charts: {
          booksAdded: { labels: last7Days.map(d => d.label), data: last7Days.map(d => d.value) },
          borrowedTrend: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], data: borrowData }
        },
        recentActivity: limitedActivity
      };
    }

    // === STUDENT STATS – PERSONAL ONLY ===
    let studentStats = null;
    if (user.role === 'student') {
      // 1. Total borrowed ever
      const totalBorrowed = await db.collection('borrows').countDocuments({ userId: user.id });

      // 2. Total views – we count every borrow as a view
      const totalViews = totalBorrowed;

      // 3. Currently borrowed (active)
      const currentBorrows = await db.collection('borrows')
        .find({ userId: user.id, returnedAt: null })
        .sort({ borrowedAt: -1 })
        .toArray();

      const currentBooks = currentBorrows.map(b => ({
        bookId: b.bookId,
        bookTitle: b.bookTitle,
        dueDate: new Date(b.dueDate).toISOString().split('T')[0],
        borrowedAt: new Date(b.borrowedAt).toISOString().split('T')[0],
        fine: calculateFine(b.dueDate),
      }));

      // 4. Borrowing history (last 10)
      const history = await db.collection('borrows')
        .find({ userId: user.id })
        .sort({ borrowedAt: -1 })
        .limit(10)
        .toArray();

      const historyFormatted = history.map(b => ({
        bookTitle: b.bookTitle,
        borrowedAt: new Date(b.borrowedAt).toISOString().split('T')[0],
        returnedAt: b.returnedAt ? new Date(b.returnedAt).toISOString().split('T')[0] : null,
        fine: b.fine || 0,
        status: b.returnedAt ? 'Returned' : 'Active',
      }));

      // 5. Reading progress logic based on totalViews
      let readingProgress = 0;
      if (totalViews === 0) {
        readingProgress = 0;
      } else if (totalViews >= 1 && totalViews < 3) {
        readingProgress = 10;
      } else if (totalViews >= 3 && totalViews < 6) {
        readingProgress = 20;
      } else if (totalViews >= 6 && totalViews < 10) {
        readingProgress = 25;
      } else if (totalViews >= 10 && totalViews < 20) {
        readingProgress = 30;
      } else if (totalViews >= 20 && totalViews < 40) {
        readingProgress = 40;
      } else if (totalViews >= 40 && totalViews < 70) {
        readingProgress = 50;
      } else if (totalViews >= 70 && totalViews < 90) {
        readingProgress = 60;
      } else if (totalViews >= 90 && totalViews < 100) {
        readingProgress = 70;
      } else if (totalViews >= 100 && totalViews < 150) {
        readingProgress = 80;
      } else if (totalViews >= 150 && totalViews <= 200) {
        readingProgress = 90;
      } else if (totalViews > 200) {
        readingProgress = 100;
      }

      // 6. Books to return count
      const booksToReturn = currentBorrows.length;

      studentStats = {
        totalBorrowed,
        totalViews,
        booksToReturn,
        currentBooks,
        history: historyFormatted,
        readingProgress,
      };
    }

    // === FINAL RESPONSE ===
    res.json({
      admin: adminStats,
      librarian: librarianStats,
      teacher: teacherStats,
      student: studentStats,  // ← NEW: Student gets their own data
    });

  } catch (e) {
    console.error('Dashboard error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};