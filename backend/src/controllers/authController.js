//controllers/authController.js
import { connectDB } from '../config/db.js';
import { comparePassword, hashPassword } from '../utils/hash.js';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import sendEmail from '../utils/sendEmail.js';

// ------------------------------------------------------------
// 1. FIRST LOGIN: ID (required) + New Username + New Email
// ------------------------------------------------------------
const firstLoginSchema = Joi.object({
  id: Joi.string().required(),
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
});

export const firstLogin = async (req, res) => {
  const { error, value } = firstLoginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();
    
    // 1. Find the user based on ID (which Admin created)
    const user = await db.collection('users').findOne({
      id: value.id,
    });

    if (!user) {
      return res.status(404).json({ message: 'ID not found. Please contact Admin.' });
    }

    // 2. If password is already changed, they should login normally
    if (user.passwordChanged) {
      return res.status(400).json({ message: 'Account already active. Please login.' });
    }

    // 3. Check if the requested Username or Email is already taken by ANOTHER user
    const existingUser = await db.collection('users').findOne({
      $or: [
        { username: value.username },
        { email: value.email }
      ],
      id: { $ne: value.id } // Exclude current user (in case they are retrying)
    });

    if (existingUser) {
      if (existingUser.username === value.username) {
        return res.status(400).json({ message: 'Username is already taken.' });
      }
      if (existingUser.email === value.email) {
        return res.status(400).json({ message: 'Email is already registered.' });
      }
    }

    // 4. Update the user record with the self-registered Username and Email
    // We do NOT set passwordChanged here; that happens in the next step (/change-password)
    await db.collection('users').updateOne(
      { id: value.id },
      { 
        $set: { 
          username: value.username,
          email: value.email 
        } 
      }
    );

    // 5. Generate token using the NEW username and ID
    const token = jwt.sign(
      { userId: user.id, username: value.username, action: 'first-change' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ token, message: 'Identity verified. Please set your password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------
// 2. CHANGE PASSWORD (FIRST TIME OR RESET via token)
// ------------------------------------------------------------
const changePwdSchema = Joi.object({
  username: Joi.string().required(),
  id: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

export const changePassword = async (req, res) => {
  const { error, value } = changePwdSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({
      username: value.username,
      id: value.id,
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Modified Logic: Check if password changed AND user is NOT in reset mode
    // If user.isPasswordResetting is true, we allow the change even if passwordChanged is true
    if (user.passwordChanged && !user.isPasswordResetting) {
      return res.status(400).json({ message: 'Password already changed' });
    }

    const hashed = await hashPassword(value.newPassword);

    await db.collection('users').updateOne(
      { id: value.id },
      { 
        $set: { password: hashed, passwordChanged: true },
        $unset: { isPasswordResetting: "", otp: "", otpExpires: "" } // Clean up reset flags
      }
    );

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------
// 3. NORMAL LOGIN – ADMIN ALWAYS ALLOWED
// ------------------------------------------------------------
const normalLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const login = async (req, res) => {
  const { error, value } = normalLoginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({ username: value.username });

    if (!user) return res.status(401).json({ message: 'Invalid username or password' });

    // DEACTIVATED: BLOCK NON-ADMIN
    if (user.status === 'deactive' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Your account is deactivated. Contact admin.' });
    }

    if (!user.passwordChanged) {
      return res.status(403).json({ message: 'Please set your password using username + ID first.' });
    }

    const match = await comparePassword(value.password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid username or password' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      id: user.id,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------
// 4. CHANGE PASSWORD AFTER LOGIN (PROTECTED)
// ------------------------------------------------------------
const changePwdAfterLoginSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

export const changePasswordAfterLogin = async (req, res) => {
  const { error, value } = changePwdAfterLoginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();

    // req.user.id comes from protect middleware
    const user = await db.collection('users').findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify old password
    const isMatch = await comparePassword(value.oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Old password is incorrect' });

    // Hash new password
    const hashed = await hashPassword(value.newPassword);

    // Update password
    await db.collection('users').updateOne(
      { id: req.user.id },
      { $set: { password: hashed } }
    );

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------
// 5. FORGOT PASSWORD (OTP GENERATION)
// ------------------------------------------------------------
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const forgotPassword = async (req, res) => {
  const { error, value } = forgotPasswordSchema.validate(req.body);
  if (error) return res.status(400).json({ message: 'Please provide a valid email address' });

  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({ email: value.email });

    if (!user) {
      // Return 404 if email not found in database
      return res.status(404).json({ message: 'No user found with this email address.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Save OTP to user document
    await db.collection('users').updateOne(
      { email: value.email },
      { $set: { otp, otpExpires } }
    );

    // Send Email
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Use the following OTP code to verify your identity:</p>
        <h1 style="color: #4f46e5; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Password Reset OTP - Library System',
        message,
      });

      res.status(200).json({ message: 'OTP sent to your email.' });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Rollback OTP if email fails
      await db.collection('users').updateOne(
        { email: value.email },
        { $unset: { otp: "", otpExpires: "" } }
      );
      return res.status(500).json({ message: 'Email could not be sent. Please check server logs.' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------
// 6. VERIFY OTP
// ------------------------------------------------------------
const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

export const verifyOtp = async (req, res) => {
  const { error, value } = verifyOtpSchema.validate(req.body);
  if (error) return res.status(400).json({ message: 'Invalid details provided' });

  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({ 
      email: value.email,
      otp: value.otp,
      otpExpires: { $gt: Date.now() } // Check if OTP is not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP is valid. 
    // Set a flag 'isPasswordResetting' to allow the changePassword endpoint to work
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { isPasswordResetting: true } }
    );

    // Generate a token compatible with the /change-password page (username, userId)
    // This allows the user to access the password reset screen
    const token = jwt.sign(
      { userId: user.id, username: user.username, action: 'reset-verified' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ 
      message: 'OTP verified successfully',
      token // This token will be stored as 'changeToken' in frontend
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------
// 7. CHANGE USERNAME (PROTECTED)
// ------------------------------------------------------------
const changeUsernameSchema = Joi.object({
  newUsername: Joi.string().min(3).required(),
});

export const changeUsername = async (req, res) => {
  const { error, value } = changeUsernameSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();
    const { id } = req.user; // from protect middleware

    // Check if new username is taken by ANYONE else
    const existing = await db.collection('users').findOne({ 
      username: value.newUsername,
      id: { $ne: id } // Exclude self
    });

    if (existing) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Update
    await db.collection('users').updateOne(
      { id },
      { $set: { username: value.newUsername } }
    );

    res.json({ message: 'Username updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};