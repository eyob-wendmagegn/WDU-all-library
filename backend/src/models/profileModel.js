// models/profileModel.js

/**
 * Profile Model
 * Contains all database queries for profile operations
 * This follows the same structure as your existing code
 */
export class ProfileModel {
  constructor(db) {
    this.db = db;
    this.profilesCollection = db.collection('profiles');
    this.usersCollection = db.collection('users');
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    // First try to find user by id
    let user = await this.usersCollection.findOne({ id: userId });
    
    // If not found by id, try by username
    if (!user) {
      user = await this.usersCollection.findOne({ username: userId });
    }
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Extract user name and initial
    let userName = 'User';
    if (user.name) {
      userName = user.name.trim();
    } else if (user.username) {
      userName = user.username.trim();
    }
    
    const defaultInitial = userName.charAt(0).toUpperCase();
    
    // Check for saved profile
    const profile = await this.profilesCollection.findOne({ userId: user.id });
    
    const profileData = {
      userId: user.id,
      username: user.username || 'User',
      name: userName,
      profileImage: null,
      defaultInitial,
      hasCustomImage: false,
      userRole: user.role || 'user',
      userStatus: user.status || 'active',
      email: user.email || null
    };
    
    if (profile && profile.profileImage) {
      profileData.profileImage = profile.profileImage;
      profileData.hasCustomImage = true;
    }
    
    return profileData;
  }

  /**
   * Update profile image
   */
  async updateProfileImage(userId, profileImage) {
    if (!profileImage) {
      throw new Error('Profile image is required');
    }
    
    // Validate image size (4.5MB for base64 ≈ 3.4MB actual image)
    const maxBase64Length = 4.5 * 1024 * 1024;
    
    if (profileImage.length > maxBase64Length) {
      const sizeInMB = (profileImage.length / (1024 * 1024)).toFixed(2);
      throw new Error(`Image is too large (${sizeInMB}MB). Must be less than 3MB. Please choose a smaller image.`);
    }
    
    // Validate base64 format
    const base64ImageRegex = /^data:image\/(jpeg|jpg|png|gif|webp|bmp|svg\+xml);base64,/i;
    const anyBase64Regex = /^data:[^;]+;base64,/i;
    const pureBase64Regex = /^[A-Za-z0-9+/=]+$/;
    
    let isValidFormat = false;
    
    if (base64ImageRegex.test(profileImage)) {
      isValidFormat = true;
    } else if (anyBase64Regex.test(profileImage)) {
      // Normalize common formats
      if (profileImage.includes('data:image/jpg;base64,')) {
        profileImage = profileImage.replace('data:image/jpg;base64,', 'data:image/jpeg;base64,');
      }
      isValidFormat = true;
    } else if (pureBase64Regex.test(profileImage.replace(/\s/g, ''))) {
      // Pure base64 without data URL prefix
      profileImage = 'data:image/png;base64,' + profileImage;
      isValidFormat = true;
    }
    
    if (!isValidFormat) {
      throw new Error('Invalid image format. Please use JPG, PNG, GIF, WEBP, or BMP format.');
    }
    
    // Get user info
    const user = await this.usersCollection.findOne({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    
    let userName = 'User';
    if (user.name) {
      userName = user.name.trim();
    } else if (user.username) {
      userName = user.username.trim();
    }
    
    const defaultInitial = userName.charAt(0).toUpperCase();
    
    // Check if profile exists
    const existingProfile = await this.profilesCollection.findOne({ userId: user.id });
    
    const profileData = {
      userId: user.id,
      username: user.username || 'User',
      name: userName,
      profileImage: profileImage,
      defaultInitial,
      hasCustomImage: true,
      updatedAt: new Date()
    };
    
    let result;
    if (existingProfile) {
      // Update existing profile
      result = await this.profilesCollection.updateOne(
        { userId: user.id },
        { $set: profileData }
      );
    } else {
      // Create new profile
      profileData.createdAt = new Date();
      result = await this.profilesCollection.insertOne(profileData);
    }
    
    return {
      success: true,
      profile: profileData,
      operation: existingProfile ? 'updated' : 'created'
    };
  }

  /**
   * Remove profile image
   */
  async removeProfileImage(userId) {
    // Get user info
    const user = await this.usersCollection.findOne({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    
    let userName = 'User';
    if (user.name) {
      userName = user.name.trim();
    } else if (user.username) {
      userName = user.username.trim();
    }
    
    const defaultInitial = userName.charAt(0).toUpperCase();
    
    // Remove profile image
    const result = await this.profilesCollection.updateOne(
      { userId: user.id },
      { 
        $set: { 
          profileImage: null,
          hasCustomImage: false,
          updatedAt: new Date()
        }
      }
    );
    
    return {
      success: true,
      profile: {
        userId: user.id,
        username: user.username || 'User',
        name: userName,
        profileImage: null,
        defaultInitial,
        hasCustomImage: false
      },
      modified: result.modifiedCount > 0
    };
  }

  /**
   * Create or update user profile with default data
   */
  async createOrUpdateProfile(userId) {
    // Find user
    const user = await this.usersCollection.findOne({ id: userId });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    let userName = 'User';
    if (user.name) {
      userName = user.name.trim();
    } else if (user.username) {
      userName = user.username.trim();
    }
    
    const defaultInitial = userName.charAt(0).toUpperCase();
    
    // Check if profile already exists
    const existingProfile = await this.profilesCollection.findOne({ userId: user.id });
    
    if (existingProfile) {
      // Profile exists, return it
      const profileData = {
        userId: user.id,
        username: user.username || 'User',
        name: userName,
        profileImage: existingProfile.profileImage || null,
        defaultInitial,
        hasCustomImage: existingProfile.profileImage ? true : false,
        createdAt: existingProfile.createdAt,
        updatedAt: existingProfile.updatedAt
      };
      
      return {
        success: true,
        profile: profileData,
        operation: 'existing'
      };
    }
    
    // Create new profile
    const profileData = {
      userId: user.id,
      username: user.username || 'User',
      name: userName,
      profileImage: null,
      defaultInitial,
      hasCustomImage: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.profilesCollection.insertOne(profileData);
    
    return {
      success: true,
      profile: { ...profileData, _id: result.insertedId },
      operation: 'created'
    };
  }

  /**
   * Get profile by user ID
   */
  async getProfileByUserId(userId) {
    return await this.profilesCollection.findOne({ userId });
  }

  /**
   * Get multiple profiles by user IDs
   */
  async getProfilesByUserIds(userIds) {
    const profiles = await this.profilesCollection
      .find({ userId: { $in: userIds } })
      .toArray();
    
    // Get user info for profiles
    const users = await this.usersCollection
      .find({ id: { $in: userIds } })
      .project({ id: 1, name: 1, username: 1, role: 1 })
      .toArray();
    
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = {
        name: user.name || user.username || 'User',
        username: user.username,
        role: user.role
      };
    });
    
    // Combine profile and user data
    const enrichedProfiles = userIds.map(userId => {
      const profile = profiles.find(p => p.userId === userId);
      const userInfo = userMap[userId] || { name: 'User', username: userId, role: 'user' };
      
      let profileImage = null;
      let hasCustomImage = false;
      let defaultInitial = userInfo.name.charAt(0).toUpperCase();
      
      if (profile && profile.profileImage) {
        profileImage = profile.profileImage;
        hasCustomImage = true;
      }
      
      return {
        userId,
        username: userInfo.username,
        name: userInfo.name,
        role: userInfo.role,
        profileImage,
        defaultInitial,
        hasCustomImage
      };
    });
    
    return enrichedProfiles;
  }

  /**
   * Search profiles
   */
  async searchProfiles(searchTerm, page = 1, limit = 10) {
    // First search users
    const userQuery = {
      $or: [
        { id: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    const users = await this.usersCollection
      .find(userQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
    const userIds = users.map(user => user.id);
    
    // Get profiles for these users
    const profiles = await this.profilesCollection
      .find({ userId: { $in: userIds } })
      .toArray();
    
    const profileMap = {};
    profiles.forEach(profile => {
      profileMap[profile.userId] = profile;
    });
    
    // Combine data
    const enrichedProfiles = users.map(user => {
      const profile = profileMap[user.id];
      
      let userName = 'User';
      if (user.name) {
        userName = user.name.trim();
      } else if (user.username) {
        userName = user.username.trim();
      }
      
      const defaultInitial = userName.charAt(0).toUpperCase();
      
      return {
        userId: user.id,
        username: user.username || 'User',
        name: userName,
        email: user.email || null,
        role: user.role || 'user',
        status: user.status || 'active',
        profileImage: profile?.profileImage || null,
        defaultInitial,
        hasCustomImage: profile?.profileImage ? true : false,
        createdAt: user.createdAt,
        profileCreatedAt: profile?.createdAt
      };
    });
    
    const total = await this.usersCollection.countDocuments(userQuery);
    
    return {
      profiles: enrichedProfiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update profile information
   */
  async updateProfileInfo(userId, updateData) {
    const allowedFields = ['name', 'email', 'bio', 'phone', 'address'];
    const filteredUpdate = {};
    
    // Only allow specific fields to be updated
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        filteredUpdate[key] = updateData[key];
      }
    });
    
    if (Object.keys(filteredUpdate).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    filteredUpdate.updatedAt = new Date();
    
    const result = await this.profilesCollection.updateOne(
      { userId },
      { $set: filteredUpdate },
      { upsert: true }
    );
    
    return {
      success: result.modifiedCount > 0 || result.upsertedCount > 0,
      operation: result.upsertedCount > 0 ? 'created' : 'updated',
      modifiedCount: result.modifiedCount
    };
  }

  /**
   * Get profile statistics
   */
  async getProfileStatistics() {
    const totalProfiles = await this.profilesCollection.countDocuments();
    const profilesWithImages = await this.profilesCollection.countDocuments({ 
      profileImage: { $ne: null } 
    });
    
    const byRole = await this.usersCollection.aggregate([
      { $lookup: {
        from: 'profiles',
        localField: 'id',
        foreignField: 'userId',
        as: 'profile'
      }},
      { $project: {
        role: 1,
        hasProfile: { $cond: [{ $gt: [{ $size: '$profile' }, 0] }, true, false] },
        hasImage: { $cond: [{ $gt: [{ $size: { $filter: { input: '$profile', as: 'p', cond: { $ne: ['$$p.profileImage', null] } } } }, 0] }, true, false] }
      }},
      { $group: {
        _id: '$role',
        totalUsers: { $sum: 1 },
        withProfile: { $sum: { $cond: ['$hasProfile', 1, 0] } },
        withImage: { $sum: { $cond: ['$hasImage', 1, 0] } }
      }},
      { $sort: { totalUsers: -1 } }
    ]).toArray();
    
    const recentProfiles = await this.profilesCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    return {
      totalProfiles,
      profilesWithImages,
      profilesWithoutImages: totalProfiles - profilesWithImages,
      byRole,
      recentProfiles,
      lastUpdated: new Date()
    };
  }

  /**
   * Delete profile
   */
  async deleteProfile(userId) {
    const result = await this.profilesCollection.deleteOne({ userId });
    
    return {
      success: result.deletedCount > 0,
      deletedCount: result.deletedCount
    };
  }

  /**
   * Bulk update profiles
   */
  async bulkUpdateProfiles(updates) {
    const bulkOperations = updates.map(update => ({
      updateOne: {
        filter: { userId: update.userId },
        update: { $set: update.data },
        upsert: true
      }
    }));
    
    if (bulkOperations.length === 0) {
      return { modifiedCount: 0, upsertedCount: 0 };
    }
    
    const result = await this.profilesCollection.bulkWrite(bulkOperations);
    return result;
  }
}

/**
 * Initialize and export the ProfileModel instance
 */
export function initProfileModel(db) {
  return new ProfileModel(db);
}

/**
 * Default export for convenience
 */
export default ProfileModel;