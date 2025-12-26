
import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { connectDB } from '../config/db.js';

/* --------------------------------------------------------------
   JOI Schemas
   -------------------------------------------------------------- */
const requestSchema = Joi.object({
  userId: Joi.string().required(),
  username: Joi.string().required(),
  bookId: Joi.string().required(),
  bookName: Joi.string().required(),
  dueDate: Joi.date().min('now').required(),
  userType: Joi.string().valid('student', 'teacher', 'librarian', 'admin').optional(),
});

const approvalSchema = Joi.object({
  borrowId: Joi.string().required(),
  action: Joi.string().valid('approve', 'reject').required(),
  reason: Joi.string().optional(),
});

const returnSchema = Joi.object({
  userId: Joi.string().required(),
  bookId: Joi.string().required(),
});

// Librarian direct borrow schema
const librarianBorrowSchema = Joi.object({
  userId: Joi.string().required(),
  username: Joi.string().required(),
  bookId: Joi.string().required(),
  bookName: Joi.string().required(),
  dueDate: Joi.date().min('now').required(),
  userType: Joi.string().valid('student', 'teacher', 'librarian', 'admin').optional(),
});

/* --------------------------------------------------------------
   Helper – calculate fine based on user type
   -------------------------------------------------------------- */
const calculateFine = (dueDate, userType = 'student') => {
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
};

/* --------------------------------------------------------------
   REQUEST BOOK – create a pending request for librarian approval
   -------------------------------------------------------------- */
export const requestBook = async (req, res) => {
  const { error, value } = requestSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();

    // Get user with userType
    const user = await db.collection('users').findOne({
      id: value.userId,
      username: value.username,
    });
    if (!user) return res.status(404).json({ message: 'Invalid user ID or username' });

    const book = await db.collection('books').findOne({
      id: value.bookId,
      name: value.bookName,
    });
    if (!book) return res.status(404).json({ message: 'Invalid book ID or name' });

    // Check if user already has a pending or active borrow
    const existingActive = await db.collection('borrows').findOne({
      userId: value.userId,
      status: { $in: ['pending', 'approved', 'borrowed'] },
      returnedAt: null,
    });
    if (existingActive) {
      return res.status(400).json({
        message: 'You already have an active request or borrowed book',
        existingStatus: existingActive.status,
      });
    }

    // Check if user has a rejected request for the same book within 24 hours
    const rejectedRequest = await db.collection('borrows').findOne({
      userId: value.userId,
      bookId: value.bookId,
      status: 'rejected',
    });

    if (rejectedRequest) {
      const rejectionTime = new Date(rejectedRequest.approvedAt);
      const now = new Date();
      const hoursSinceRejection = (now - rejectionTime) / (1000 * 60 * 60);

      if (hoursSinceRejection < 24) {
        const hoursLeft = Math.ceil(24 - hoursSinceRejection);
        return res.status(400).json({
          message: `Please wait ${hoursLeft} hours before requesting this book again`,
          canRequestAfter: new Date(rejectionTime.getTime() + 24 * 60 * 60 * 1000),
        });
      }
    }

    // Create the request
    const borrowRequest = {
      userId: value.userId,
      username: value.username,
      bookId: value.bookId,
      bookName: value.bookName,
      bookTitle: book.title,
      userType: user.role || 'student',
      requestedAt: new Date(),
      dueDate: new Date(value.dueDate),
      status: 'pending',
      borrowedAt: null,
      returnedAt: null,
      fine: 0,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      requestedBy: value.userId,
    };

    await db.collection('borrows').insertOne(borrowRequest);

    res.status(201).json({
      message: 'Book request submitted for librarian approval',
      request: borrowRequest,
      availability: book.copies > 0 ? 'available' : 'none',
      userType: user.role,
      finePolicy: user.role === 'teacher' ? '2 days grace period' : '1 day grace period'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------------------
   APPROVE/REJECT REQUEST – librarian action
   -------------------------------------------------------------- */
export const approveRequest = async (req, res) => {
  const { error, value } = approvalSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();

    const borrow = await db.collection('borrows').findOne({
      _id: new ObjectId(value.borrowId),
      status: 'pending',
    });
    if (!borrow) return res.status(404).json({ message: 'Pending request not found' });

    if (value.action === 'approve') {
      // Check if book still has copies available
      const book = await db.collection('books').findOne({ id: borrow.bookId });
      if (!book || book.copies <= 0) {
        return res.status(400).json({ message: 'No copies available' });
      }

      // Check if user already has an active borrow or approved request
      const existingBorrow = await db.collection('borrows').findOne({
        userId: borrow.userId,
        status: { $in: ['approved', 'borrowed'] },
        returnedAt: null,
      });
      if (existingBorrow) {
        return res.status(400).json({ 
          message: 'User already has a borrowed book or an approved request' 
        });
      }

      // Update borrow record to 'approved' (Student must confirm to borrow)
      await db.collection('borrows').updateOne(
        { _id: borrow._id },
        {
          $set: {
            status: 'approved',
            approvedBy: req.user.id,
            approvedAt: new Date(),
          },
        }
      );

      res.json({ 
        message: 'Request approved. Student must confirm borrowing to finalize.', 
        status: 'approved',
        userType: borrow.userType
      });
    } else if (value.action === 'reject') {
      await db.collection('borrows').updateOne(
        { _id: borrow._id },
        {
          $set: {
            status: 'rejected',
            approvedBy: req.user.id,
            approvedAt: new Date(),
            rejectionReason: value.reason || 'Request rejected',
          },
        }
      );

      res.json({ 
        message: 'Request rejected', 
        status: 'rejected' 
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------------------
   CONFIRM BORROW – student action to finalize borrowing after approval
   -------------------------------------------------------------- */
export const confirmBorrow = async (req, res) => {
  const { borrowId } = req.body;
  if (!borrowId) return res.status(400).json({ message: 'Borrow ID is required' });

  try {
    const db = await connectDB();
    
    // Find the approved request for the authenticated user
    const borrow = await db.collection('borrows').findOne({
      _id: new ObjectId(borrowId),
      userId: req.user.id,
      status: 'approved',
      returnedAt: null
    });

    if (!borrow) {
      return res.status(404).json({ message: 'No approved request found for confirmation' });
    }

    // Check book availability again
    const book = await db.collection('books').findOne({ id: borrow.bookId });
    if (!book || book.copies <= 0) {
      return res.status(400).json({ message: 'No copies available for confirmation' });
    }

    // Update to borrowed status and set current date
    await db.collection('borrows').updateOne(
      { _id: borrow._id },
      {
        $set: {
          status: 'borrowed',
          borrowedAt: new Date(),
        },
      }
    );

    // Reduce book copies in inventory
    await db.collection('books').updateOne(
      { id: borrow.bookId },
      { $inc: { copies: -1 } }
    );

    res.json({
      message: 'Book confirmed and borrowed successfully',
      status: 'borrowed'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------------------
   LIBRARIAN BORROW – Direct borrow without approval
   -------------------------------------------------------------- */
export const librarianBorrowBook = async (req, res) => {
  const { error, value } = librarianBorrowSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();

    // Get user with role
    const user = await db.collection('users').findOne({
      id: value.userId,
      username: value.username,
    });
    if (!user) return res.status(404).json({ message: 'Invalid user ID or username' });

    const book = await db.collection('books').findOne({
      id: value.bookId,
      name: value.bookName,
    });
    if (!book) return res.status(404).json({ message: 'Invalid book ID or name' });

    // Check if user already has an active borrow
    const existing = await db.collection('borrows').findOne({
      userId: value.userId,
      status: 'borrowed',
      returnedAt: null,
    });
    if (existing) return res.status(400).json({ 
      message: 'User already has a borrowed book' 
    });

    // Check book availability
    if (book.copies <= 0) return res.status(400).json({ 
      message: 'No copies available' 
    });

    // Create borrow record with userType
    const borrowRecord = {
      userId: value.userId,
      username: value.username,
      bookId: value.bookId,
      bookName: value.bookName,
      bookTitle: book.title,
      userType: user.role || 'student',
      borrowedAt: new Date(),
      dueDate: new Date(value.dueDate),
      returnedAt: null,
      fine: 0,
      status: 'borrowed',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      requestedBy: req.user.id,
    };

    await db.collection('borrows').insertOne(borrowRecord);
    await db.collection('books').updateOne(
      { id: value.bookId }, 
      { $inc: { copies: -1 } }
    );

    res.status(201).json({ 
      message: 'Book borrowed successfully', 
      borrow: borrowRecord,
      finePolicy: user.role === 'teacher' ? '2 days grace period' : '1 day grace period'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------------------
   RETURN – Return book and calculate fine based on user type
   -------------------------------------------------------------- */
export const returnBook = async (req, res) => {
  const { error, value } = returnSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();
    
    // Find active borrow
    const borrow = await db.collection('borrows').findOne({
      userId: value.userId,
      bookId: value.bookId,
      status: 'borrowed',
      returnedAt: null,
    });
    
    if (!borrow) return res.status(404).json({ 
      message: 'No active borrow found' 
    });

    // Calculate fine based on user type
    const fine = calculateFine(borrow.dueDate, borrow.userType);
    const now = new Date();

    // Update borrow record
    await db.collection('borrows').updateOne(
      { _id: borrow._id },
      { 
        $set: { 
          returnedAt: now, 
          fine,
          status: 'returned' 
        } 
      }
    );

    // Return book copy
    await db.collection('books').updateOne(
      { id: value.bookId },
      { $inc: { copies: 1 } }
    );

    res.json({ 
      message: 'Returned successfully', 
      fine,
      userType: borrow.userType,
      daysLate: Math.ceil((now - new Date(borrow.dueDate)) / (1000 * 60 * 60 * 24)),
      gracePeriod: borrow.userType === 'teacher' ? 2 : 1
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------------------
   DELETE BORROW RECORD – Delete borrow record (admin/librarian only)
   -------------------------------------------------------------- */
export const deleteBorrow = async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid borrow ID format' });
    }

    // Find the borrow record
    const borrow = await db.collection('borrows').findOne({
      _id: new ObjectId(id)
    });
    
    if (!borrow) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    // Check if book is currently borrowed (not returned)
    if (borrow.status === 'borrowed' && !borrow.returnedAt) {
      // Return the book copy to inventory
      await db.collection('books').updateOne(
        { id: borrow.bookId },
        { $inc: { copies: 1 } }
      );
    }

    // Delete the borrow record
    const result = await db.collection('borrows').deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    res.json({ 
      message: 'Borrow record deleted successfully',
      returnedCopy: borrow.status === 'borrowed' && !borrow.returnedAt
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------------------
   GET ALL BORROWS – include live fine for active borrows
   -------------------------------------------------------------- */
export const getAllBorrows = async (req, res) => {
  try {
    const db = await connectDB();
    const { page = 1, limit = 10, search = '', status, userType } = req.query;

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

    if (status) {
      query.status = status;
    }

    if (userType) {
      query.userType = userType;
    }

    const borrows = await db
      .collection('borrows')
      .find(query)
      .sort({ requestedAt: -1, borrowedAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    // Add live fine for borrowed (not returned) records
    const enriched = borrows.map(b => ({
      ...b,
      fine: b.status === 'borrowed' ? calculateFine(b.dueDate, b.userType) : (b.fine || 0),
    }));

    const total = await db.collection('borrows').countDocuments(query);
    
    res.json({ 
      borrows: enriched, 
      total, 
      page: +page, 
      limit: +limit 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------------------
   GET MY BORROW – Teacher views their active borrow (using auth)
   -------------------------------------------------------------- */
export const getMyBorrow = async (req, res) => {
  try {
    const db = await connectDB();
    
    // Get user from authentication middleware (req.user)
    const userId = req.user.id;
    const username = req.user.username;
    
    if (!userId || !username) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Only return if status is 'borrowed' (approved and not returned)
    const borrow = await db.collection('borrows').findOne({
      userId: userId,
      username: username,
      status: 'borrowed',
      returnedAt: null,
    });
    
    if (!borrow) {
      // Check if user has pending or approved requests
      const pendingRequest = await db.collection('borrows').findOne({
        userId: userId,
        username: username,
        status: { $in: ['pending', 'approved'] },
        returnedAt: null,
      });
      
      if (pendingRequest) {
        return res.status(200).json({ 
          message: pendingRequest.status === 'approved' ? 'Your request is approved! Please confirm borrowing.' : 'Your request is pending approval',
          request: pendingRequest,
          status: pendingRequest.status,
          userType: req.user.role || 'teacher'
        });
      }
      
      return res.status(404).json({ 
        message: 'No active borrow or pending request found' 
      });
    }

    const fine = calculateFine(borrow.dueDate, req.user.role || 'teacher');
    const enriched = { ...borrow, fine, userType: req.user.role || 'teacher' };
    
    res.json({ 
      borrow: enriched,
      status: 'borrowed',
      userType: req.user.role || 'teacher',
      finePolicy: req.user.role === 'teacher' ? '2 days grace period' : '1 day grace period'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------------------
   GET MY REQUESTS – Teacher views all their requests (using auth)
   -------------------------------------------------------------- */
export const getMyRequests = async (req, res) => {
  try {
    const db = await connectDB();
    
    // Get user from authentication middleware
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const requests = await db
      .collection('borrows')
      .find({ 
        userId,
        $or: [
          { status: 'pending' },
          { status: 'approved' },
          { status: 'rejected' }
        ]
      })
      .sort({ requestedAt: -1 })
      .toArray();
    
    res.json({ 
      requests,
      userType: req.user.role || 'teacher',
      finePolicy: req.user.role === 'teacher' ? '2 days grace period' : '1 day grace period'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------------------
   GET FINE POLICY – Get fine policy for authenticated user
   -------------------------------------------------------------- */
export const getFinePolicy = async (req, res) => {
  try {
    const policy = {
      userType: req.user.role || 'teacher',
      gracePeriod: req.user.role === 'teacher' ? 2 : 1,
      finePerDay: 10,
      description: req.user.role === 'teacher' 
        ? '2 days grace period, then 10 ETB per day' 
        : '1 day grace period, then 10 ETB per day'
    };
    
    res.json(policy);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
