// src/controllers/profileController.js
import { connectDB } from '../config/db.js';

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Getting profile for userId:', userId);
    
    const db = await connectDB();
    
    // Find user by id (this is what your auth returns)
    let user = await db.collection('users').findOne({ id: userId });
    
    // If not found by id, try by username
    if (!user) {
      user = await db.collection('users').findOne({ username: userId });
    }
    
    if (!user) {
      console.log('User not found in users collection');
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    console.log('Found user:', { 
      id: user.id, 
      username: user.username, 
      name: user.name 
    });
    
    // Get user's name and extract first letter
    let userName = 'User';
    if (user.name) {
      userName = user.name.trim();
    } else if (user.username) {
      userName = user.username.trim();
    }
    
    const defaultInitial = userName.charAt(0).toUpperCase();
    
    console.log('User name:', userName, 'Initial:', defaultInitial);
    
    // Check if user has a saved profile image
    const profile = await db.collection('profiles').findOne({ userId: user.id });
    
    console.log('Profile from DB:', profile ? 'Found' : 'Not found');
    
    let profileData = {
      userId: user.id,
      username: user.username || 'User',
      name: userName,
      profileImage: null,
      defaultInitial,
      hasCustomImage: false
    };
    
    if (profile && profile.profileImage) {
      profileData.profileImage = profile.profileImage;
      profileData.hasCustomImage = true;
    }
    
    console.log('Returning profile data');
    
    res.json({
      success: true,
      profile: profileData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update profile image (base64 encoded)
export const updateProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    let { profileImage } = req.body;
    
    console.log('Updating profile image for userId:', userId);
    console.log('Image data received, length:', profileImage ? profileImage.length : 0);
    
    if (!profileImage) {
      return res.status(400).json({ 
        success: false,
        message: 'Profile image is required' 
      });
    }
    
    // 4.5MB FOR BASE64 (3MB original ≈ 4MB base64 + buffer)
    const maxBase64Length = 4.5 * 1024 * 1024; // ~4.5MB base64 ≈ 3.4MB actual image
    
    if (profileImage.length > maxBase64Length) {
      console.log('Image too large:', profileImage.length, 'bytes');
      const sizeInMB = (profileImage.length / (1024 * 1024)).toFixed(2);
      return res.status(400).json({ 
        success: false,
        message: `Image is too large (${sizeInMB}MB). Must be less than 3MB. Please choose a smaller image.` 
      });
    }
    
    console.log('Image size OK:', profileImage.length, 'bytes');
    
    // Flexible base64 validation - accept various formats
    const base64ImageRegex = /^data:image\/(jpeg|jpg|png|gif|webp|bmp|svg\+xml);base64,/i;
    const anyBase64Regex = /^data:[^;]+;base64,/i;
    const pureBase64Regex = /^[A-Za-z0-9+/=]+$/;
    
    let isValidFormat = false;
    
    if (base64ImageRegex.test(profileImage)) {
      console.log('Valid image base64 format detected');
      isValidFormat = true;
    } else if (anyBase64Regex.test(profileImage)) {
      // Might be other format like data:image/jpg;base64, (without proper subtype)
      console.log('Base64 with data URL detected, accepting it');
      isValidFormat = true;
      
      // Try to normalize it if it's a common image format
      if (profileImage.includes('data:image/jpg;base64,')) {
        profileImage = profileImage.replace('data:image/jpg;base64,', 'data:image/jpeg;base64,');
      }
    } else if (pureBase64Regex.test(profileImage.replace(/\s/g, ''))) {
      // Pure base64 without data URL prefix
      console.log('Pure base64 detected, adding data URL prefix');
      profileImage = 'data:image/png;base64,' + profileImage;
      isValidFormat = true;
    } else {
      console.error('Invalid image format');
      // Log first 50 chars for debugging
      console.log('First 50 chars:', profileImage.substring(0, 50));
      
      return res.status(400).json({ 
        success: false,
        message: 'Invalid image format. Please use JPG, PNG, GIF, WEBP, or BMP format.' 
      });
    }
    
    if (!isValidFormat) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid image data format' 
      });
    }
    
    const db = await connectDB();
    
    // Get user info
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    let userName = 'User';
    if (user.name) {
      userName = user.name.trim();
    } else if (user.username) {
      userName = user.username.trim();
    }
    
    const defaultInitial = userName.charAt(0).toUpperCase();
    
    // Check if profile exists
    const existingProfile = await db.collection('profiles').findOne({ userId: user.id });
    
    const profileData = {
      userId: user.id,
      username: user.username || 'User',
      name: userName,
      profileImage: profileImage,
      defaultInitial,
      hasCustomImage: true,
      updatedAt: new Date()
    };
    
    if (existingProfile) {
      // Update existing profile
      await db.collection('profiles').updateOne(
        { userId: user.id },
        { $set: profileData }
      );
      console.log('Updated profile image for user:', userName);
    } else {
      // Create new profile
      profileData.createdAt = new Date();
      await db.collection('profiles').insertOne(profileData);
      console.log('Created new profile with image for user:', userName);
    }
    
    console.log('Profile image updated successfully');
    
    res.json({
      success: true,
      message: 'Profile image updated successfully',
      profile: profileData
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating profile image', 
      error: error.message 
    });
  }
};

// Remove profile image (revert to default initial)
export const removeProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Removing profile image for userId:', userId);
    
    const db = await connectDB();
    
    // Get user info
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    let userName = 'User';
    if (user.name) {
      userName = user.name.trim();
    } else if (user.username) {
      userName = user.username.trim();
    }
    
    const defaultInitial = userName.charAt(0).toUpperCase();
    
    // Remove profile image (set to null)
    await db.collection('profiles').updateOne(
      { userId: user.id },
      { 
        $set: { 
          profileImage: null,
          hasCustomImage: false,
          updatedAt: new Date()
        }
      }
    );
    
    res.json({
      success: true,
      message: 'Profile image removed successfully',
      profile: {
        userId: user.id,
        username: user.username || 'User',
        name: userName,
        profileImage: null,
        defaultInitial,
        hasCustomImage: false
      }
    });
  } catch (error) {
    console.error('Remove profile image error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Create or update user profile with default data
export const createOrUpdateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Creating/updating profile for userId:', userId);
    
    const db = await connectDB();
    
    // Find user
    const user = await db.collection('users').findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    let userName = 'User';
    if (user.name) {
      userName = user.name.trim();
    } else if (user.username) {
      userName = user.username.trim();
    }
    
    const defaultInitial = userName.charAt(0).toUpperCase();
    
    // Check if profile already exists
    const existingProfile = await db.collection('profiles').findOne({ userId: user.id });
    
    if (existingProfile) {
      // Profile exists, return it
      const profileData = {
        userId: user.id,
        username: user.username || 'User',
        name: userName,
        profileImage: existingProfile.profileImage || null,
        defaultInitial,
        hasCustomImage: existingProfile.profileImage ? true : false
      };
      
      return res.json({
        success: true,
        message: 'Profile already exists',
        profile: profileData
      });
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
    
    await db.collection('profiles').insertOne(profileData);
    console.log('Created new profile for user:', userName);
    
    res.json({
      success: true,
      message: 'Profile created successfully',
      profile: profileData
    });
  } catch (error) {
    console.error('Create/update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};