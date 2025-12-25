// models/telegramModel.js

/**
 * Telegram Model
 * Contains all database queries for telegram operations
 * This follows the same structure as your existing code
 */
export class TelegramModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('telegram_links'); // Optional collection for storing links
  }

  /**
   * Get Telegram redirect URL
   * Returns the URL from environment or default
   */
  async getRedirectUrl() {
    // Check if we have stored URL in database
    const storedLink = await this.getStoredTelegramLink();
    
    if (storedLink && storedLink.url) {
      return storedLink.url;
    }
    
    // Fall back to environment variable or default
    return process.env.TELEGRAM_GROUP_URL || 'https://t.me';
  }

  /**
   * Get stored Telegram link from database
   * This is optional - you can store multiple links or manage them via admin
   */
  async getStoredTelegramLink() {
    try {
      // Check if collection exists
      const collections = await this.db.listCollections({ name: 'telegram_links' }).toArray();
      if (collections.length === 0) {
        return null;
      }
      
      // Get the active link (assuming one active link)
      const link = await this.collection.findOne({ isActive: true });
      return link;
    } catch (error) {
      // Collection might not exist yet
      return null;
    }
  }

  /**
   * Update Telegram link in database
   * Admin can update the Telegram group URL
   */
  async updateTelegramLink(newUrl, updatedBy = null) {
    try {
      // Ensure collection exists
      await this.ensureCollectionExists();
      
      // Deactivate all existing links
      await this.collection.updateMany(
        { isActive: true },
        { $set: { isActive: false } }
      );
      
      // Insert new active link
      const linkData = {
        url: newUrl,
        isActive: true,
        updatedBy: updatedBy || 'system',
        updatedAt: new Date(),
        createdAt: new Date()
      };
      
      const result = await this.collection.insertOne(linkData);
      
      return {
        success: true,
        message: 'Telegram link updated successfully',
        link: { ...linkData, _id: result.insertedId }
      };
    } catch (error) {
      console.error('Error updating Telegram link:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Telegram link history
   */
  async getTelegramLinkHistory(page = 1, limit = 10) {
    try {
      await this.ensureCollectionExists();
      
      const links = await this.collection
        .find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      
      const total = await this.collection.countDocuments();
      
      return {
        links,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      // Collection might not exist yet
      return {
        links: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  /**
   * Get Telegram statistics
   */
  async getTelegramStats() {
    try {
      await this.ensureCollectionExists();
      
      const totalLinks = await this.collection.countDocuments();
      const activeLink = await this.collection.findOne({ isActive: true });
      
      const statsByYear = await this.collection.aggregate([
        {
          $group: {
            _id: { $year: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]).toArray();
      
      const recentUpdates = await this.collection
        .find({})
        .sort({ updatedAt: -1 })
        .limit(5)
        .toArray();
      
      return {
        totalLinks,
        activeLink,
        statsByYear,
        recentUpdates,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        totalLinks: 0,
        activeLink: null,
        statsByYear: [],
        recentUpdates: [],
        lastChecked: new Date(),
        error: 'Collection not initialized'
      };
    }
  }

  /**
   * Ensure collection exists
   */
  async ensureCollectionExists() {
    try {
      const collections = await this.db.listCollections({ name: 'telegram_links' }).toArray();
      if (collections.length === 0) {
        // Create collection with schema validation
        await this.db.createCollection('telegram_links', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: ['url', 'isActive', 'createdAt'],
              properties: {
                url: {
                  bsonType: 'string',
                  description: 'Telegram group/invite URL'
                },
                isActive: {
                  bsonType: 'bool',
                  description: 'Whether this link is currently active'
                },
                updatedBy: {
                  bsonType: 'string',
                  description: 'User who updated the link'
                },
                description: {
                  bsonType: 'string',
                  description: 'Optional description of the Telegram group'
                },
                memberCount: {
                  bsonType: 'int',
                  description: 'Optional member count'
                },
                createdAt: {
                  bsonType: 'date',
                  description: 'When the link was created'
                },
                updatedAt: {
                  bsonType: 'date',
                  description: 'When the link was last updated'
                }
              }
            }
          }
        });
        
        // Create indexes
        await this.collection.createIndex({ isActive: 1 });
        await this.collection.createIndex({ createdAt: -1 });
        await this.collection.createIndex({ updatedAt: -1 });
        
        // Insert default link from environment if available
        const defaultUrl = process.env.TELEGRAM_GROUP_URL;
        if (defaultUrl) {
          await this.collection.insertOne({
            url: defaultUrl,
            isActive: true,
            updatedBy: 'system',
            description: 'Default Telegram group link',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      return true;
    } catch (error) {
      console.error('Error ensuring collection exists:', error);
      return false;
    }
  }

  /**
   * Search Telegram links
   */
  async searchTelegramLinks(searchTerm, page = 1, limit = 10) {
    try {
      await this.ensureCollectionExists();
      
      const query = searchTerm 
        ? {
            $or: [
              { url: { $regex: searchTerm, $options: 'i' } },
              { description: { $regex: searchTerm, $options: 'i' } },
              { updatedBy: { $regex: searchTerm, $options: 'i' } }
            ]
          }
        : {};
      
      const links = await this.collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      
      const total = await this.collection.countDocuments(query);
      
      return {
        links,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      return {
        links: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  /**
   * Delete Telegram link
   */
  async deleteTelegramLink(linkId) {
    try {
      if (!linkId) {
        return { success: false, error: 'Link ID is required' };
      }
      
      const result = await this.collection.deleteOne({ _id: linkId });
      
      return {
        success: result.deletedCount > 0,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error('Error deleting Telegram link:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Telegram link by ID
   */
  async getTelegramLinkById(linkId) {
    try {
      const link = await this.collection.findOne({ _id: linkId });
      return link;
    } catch (error) {
      console.error('Error getting Telegram link:', error);
      return null;
    }
  }

  /**
   * Get active Telegram link with details
   */
  async getActiveTelegramLink() {
    try {
      await this.ensureCollectionExists();
      
      const link = await this.collection.findOne({ isActive: true });
      
      if (link) {
        // You could add additional processing here, like:
        // - Fetching current member count via Telegram API (if you have bot token)
        // - Checking if link is still valid
        return {
          ...link,
          isValid: true, // You could add validation logic
          lastChecked: new Date()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting active Telegram link:', error);
      return null;
    }
  }

  /**
   * Log Telegram redirect (for analytics)
   */
  async logRedirect(userId = null, userAgent = null) {
    try {
      // Optional: Create a separate collection for analytics
      const analyticsCollection = this.db.collection('telegram_analytics');
      
      const logEntry = {
        userId,
        userAgent,
        timestamp: new Date(),
        ipAddress: null, // You would get this from request context
        referrer: null,  // You would get this from request context
        redirectedTo: process.env.TELEGRAM_GROUP_URL || 'https://t.me'
      };
      
      await analyticsCollection.insertOne(logEntry);
      
      return {
        success: true,
        logged: true
      };
    } catch (error) {
      // Don't fail the redirect if logging fails
      console.error('Error logging Telegram redirect:', error);
      return {
        success: false,
        error: error.message,
        logged: false
      };
    }
  }

  /**
   * Get redirect analytics
   */
  async getRedirectAnalytics(startDate = null, endDate = null) {
    try {
      const analyticsCollection = this.db.collection('telegram_analytics');
      
      const query = {};
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      const totalRedirects = await analyticsCollection.countDocuments(query);
      
      const dailyStats = await analyticsCollection.aggregate([
        { $match: query },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ]).toArray();
      
      const recentRedirects = await analyticsCollection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
      
      return {
        totalRedirects,
        dailyStats,
        recentRedirects,
        period: { startDate, endDate }
      };
    } catch (error) {
      // Analytics collection might not exist
      return {
        totalRedirects: 0,
        dailyStats: [],
        recentRedirects: [],
        period: { startDate, endDate },
        error: 'Analytics not available'
      };
    }
  }
}

/**
 * Initialize and export the TelegramModel instance
 */
export function initTelegramModel(db) {
  return new TelegramModel(db);
}

/**
 * Default export for convenience
 */
export default TelegramModel;