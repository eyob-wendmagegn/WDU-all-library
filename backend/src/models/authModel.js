// models/authModel.js

/**
 * User Model for Authentication
 * This model represents the users collection in MongoDB
 * It follows the same structure as your existing database schema
 */
export class UserModel {
  constructor(db) {
    this.collection = db.collection('users');
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    return await this.collection.findOne({ id });
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    return await this.collection.findOne({ username });
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await this.collection.findOne({ email });
  }

  /**
   * Find user by ID or username
   */
  async findByIdOrUsername(id, username) {
    return await this.collection.findOne({
      $or: [{ id }, { username }]
    });
  }

  /**
   * Find user by ID and username (both required)
   */
  async findByIdAndUsername(id, username) {
    return await this.collection.findOne({
      id,
      username
    });
  }

  /**
   * Find user by ID and email
   */
  async findByIdAndEmail(id, email) {
    return await this.collection.findOne({
      id,
      email
    });
  }

  /**
   * Check if username or email exists (excluding current user)
   */
  async checkUsernameEmailExists(username, email, excludeId = null) {
    const query = {
      $or: [
        { username },
        { email }
      ]
    };

    if (excludeId) {
      query.id = { $ne: excludeId };
    }

    return await this.collection.findOne(query);
  }

  /**
   * Create new user (for admin registration)
   */
  async create(userData) {
    const result = await this.collection.insertOne(userData);
    return { ...userData, _id: result.insertedId };
  }

  /**
   * Update user by ID
   */
  async updateById(id, updateData) {
    const result = await this.collection.updateOne(
      { id },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result;
  }

  /**
   * Update user password
   */
  async updatePassword(id, hashedPassword) {
    return await this.collection.updateOne(
      { id },
      { 
        $set: { 
          password: hashedPassword, 
          passwordChanged: true,
          updatedAt: new Date()
        },
        $unset: { 
          isPasswordResetting: "",
          otp: "", 
          otpExpires: "" 
        }
      }
    );
  }

  /**
   * Update username
   */
  async updateUsername(id, newUsername) {
    return await this.collection.updateOne(
      { id },
      { $set: { username: newUsername, updatedAt: new Date() } }
    );
  }

  /**
   * Set OTP for password reset
   */
  async setOTP(email, otp, otpExpires) {
    return await this.collection.updateOne(
      { email },
      { $set: { otp, otpExpires, updatedAt: new Date() } }
    );
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email, otp) {
    return await this.collection.findOne({
      email,
      otp,
      otpExpires: { $gt: new Date() }
    });
  }

  /**
   * Set password reset flag
   */
  async setPasswordResetFlag(userId) {
    return await this.collection.updateOne(
      { _id: userId },
      { $set: { isPasswordResetting: true, updatedAt: new Date() } }
    );
  }

  /**
   * Clear OTP data
   */
  async clearOTP(email) {
    return await this.collection.updateOne(
      { email },
      { 
        $unset: { otp: "", otpExpires: "" },
        $set: { updatedAt: new Date() }
      }
    );
  }

  /**
   * Find user for password reset verification
   */
  async findForPasswordReset(email, otp) {
    return await this.collection.findOne({
      email,
      otp,
      otpExpires: { $gt: new Date() }
    });
  }

  /**
   * Get all users with pagination (for admin)
   */
  async getAllUsers(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    
    const query = {};
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { username: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const users = await this.collection
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Count total users
   */
  async countUsers(filters = {}) {
    const query = {};
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    
    return await this.collection.countDocuments(query);
  }

  /**
   * Update user status (activate/deactivate)
   */
  async updateStatus(id, status) {
    return await this.collection.updateOne(
      { id },
      { $set: { status, updatedAt: new Date() } }
    );
  }

  /**
   * Delete user by ID
   */
  async deleteById(id) {
    return await this.collection.deleteOne({ id });
  }

  /**
   * Check if user exists by ID
   */
  async existsById(id) {
    const count = await this.collection.countDocuments({ id });
    return count > 0;
  }

  /**
   * Find user by token payload (for JWT verification)
   */
  async findByTokenPayload(userId, username = null) {
    const query = { id: userId };
    if (username) {
      query.username = username;
    }
    return await this.collection.findOne(query);
  }
}

/**
 * Initialize and export the UserModel instance
 */
export function initUserModel(db) {
  return new UserModel(db);
}

/**
 * Default export for convenience
 */
export default UserModel;