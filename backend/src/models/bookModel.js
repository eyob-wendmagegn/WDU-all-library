// models/bookModel.js

/**
 * Book Model
 * Contains all database queries for book operations
 * This follows the same structure as your existing code
 */
export class BookModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('books');
  }

  /**
   * Find book by ID
   */
  async findById(id) {
    return await this.collection.findOne({ id });
  }

  /**
   * Find book by ISBN
   */
  async findByISBN(isbn) {
    return await this.collection.findOne({ isbn });
  }

  /**
   * Check if book ID exists
   */
  async existsById(id) {
    const count = await this.collection.countDocuments({ id });
    return count > 0;
  }

  /**
   * Create new book
   */
  async create(bookData, addedBy = null) {
    const newBook = {
      ...bookData,
      addedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(newBook);
    return { ...newBook, _id: result.insertedId };
  }

  /**
   * Get books with pagination and search
   */
  async getAll({ page = 1, limit = 10, search = '' }) {
    const query = search
      ? {
          $or: [
            { id: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { title: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const books = await this.collection
      .find(query)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      books,
      total,
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(total / +limit)
    };
  }

  /**
   * Update book by ID
   */
  async updateById(id, updateData) {
    const result = await this.collection.updateOne(
      { id },
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
   * Delete book by ID
   */
  async deleteById(id) {
    const result = await this.collection.deleteOne({ id });
    
    return {
      deletedCount: result.deletedCount,
      success: result.deletedCount > 0
    };
  }

  /**
   * Search books with multiple fields
   */
  async searchBooks(searchTerm, page = 1, limit = 10) {
    const query = searchTerm
      ? {
          $or: [
            { id: { $regex: searchTerm, $options: 'i' } },
            { name: { $regex: searchTerm, $options: 'i' } },
            { title: { $regex: searchTerm, $options: 'i' } },
            { author: { $regex: searchTerm, $options: 'i' } },
            { category: { $regex: searchTerm, $options: 'i' } },
            { publisher: { $regex: searchTerm, $options: 'i' } },
            { isbn: { $regex: searchTerm, $options: 'i' } },
          ],
        }
      : {};

    const books = await this.collection
      .find(query)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      books,
      total,
      page: +page,
      limit: +limit
    };
  }

  /**
   * Get books by category
   */
  async getByCategory(category, page = 1, limit = 10) {
    const books = await this.collection
      .find({ category })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await this.collection.countDocuments({ category });

    return {
      books,
      total,
      page: +page,
      limit: +limit
    };
  }

  /**
   * Update book copies count
   */
  async updateCopies(bookId, changeAmount) {
    const result = await this.collection.updateOne(
      { id: bookId },
      { 
        $inc: { copies: changeAmount },
        $set: { updatedAt: new Date() }
      }
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      success: result.matchedCount > 0
    };
  }

  /**
   * Check if book has available copies
   */
  async hasAvailableCopies(bookId) {
    const book = await this.collection.findOne({ id: bookId });
    return book && book.copies > 0;
  }

  /**
   * Get total books count
   */
  async getTotalCount() {
    return await this.collection.countDocuments();
  }

  /**
   * Get recent books
   */
  async getRecent(limit = 10) {
    return await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get books added by specific user
   */
  async getBooksByUser(userId, page = 1, limit = 10) {
    const books = await this.collection
      .find({ addedBy: userId })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await this.collection.countDocuments({ addedBy: userId });

    return {
      books,
      total,
      page: +page,
      limit: +limit
    };
  }

  /**
   * Get book statistics
   */
  async getStatistics() {
    const totalBooks = await this.collection.countDocuments();
    
    const byCategory = await this.collection.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    const availableBooks = await this.collection.countDocuments({ copies: { $gt: 0 } });
    const unavailableBooks = totalBooks - availableBooks;

    return {
      totalBooks,
      availableBooks,
      unavailableBooks,
      byCategory,
      lastUpdated: new Date()
    };
  }

  /**
   * Bulk update books
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
   * Get book categories
   */
  async getCategories() {
    const categories = await this.collection.distinct('category');
    return categories.filter(category => category); // Remove null/empty values
  }

  /**
   * Get book with related data
   */
  async getBookWithDetails(bookId) {
    const book = await this.collection.findOne({ id: bookId });
    if (!book) return null;

    // This is a base method - in real implementation you might join with other collections
    return {
      ...book,
      // Additional details can be added here
    };
  }
}

/**
 * Initialize and export the BookModel instance
 */
export function initBookModel(db) {
  return new BookModel(db);
}

/**
 * Default export for convenience
 */
export default BookModel;