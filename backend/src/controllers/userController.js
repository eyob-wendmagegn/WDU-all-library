import { connectDB } from '../config/db.js';
import { hashPassword } from '../utils/hash.js';
import Joi from 'joi';

// ------------------------------------------------------------
// CREATE USER (admin only)
// ------------------------------------------------------------
const createSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().min(2).required(),
  // Username and Email made optional so Admin can create the ID,
  // and the User sets them during First Login.
  username: Joi.string().min(3).allow('').optional(),
  email: Joi.string().email().allow('').optional(),
  role: Joi.string().valid('admin', 'librarian', 'teacher', 'student').required(),
  department: Joi.string().allow('').optional(),
  status: Joi.string().valid('active', 'deactive').default('active'),
});

export const createUser = async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();

    // Check ID existence (Always required)
    const idExists = await db.collection('users').findOne({ id: value.id });
    if (idExists) return res.status(400).json({ message: 'ID already in use' });

    // Only check Username/Email uniqueness if they are provided
    if (value.username && value.username.trim() !== "") {
      const usernameExists = await db.collection('users').findOne({ username: value.username.trim() });
      if (usernameExists) return res.status(400).json({ message: 'Username already taken' });
    }

    if (value.email && value.email.trim() !== "") {
      const emailExists = await db.collection('users').findOne({ email: value.email.trim() });
      if (emailExists) return res.status(400).json({ message: 'Email already registered' });
    }

    const tempPwd = 'temp123';
    const hashed = await hashPassword(tempPwd);

    const doc = {
      ...value,
      password: hashed,
      passwordChanged: false,
      createdAt: new Date(),
      // Add updatedAt field for tracking changes (FIX for report)
      updatedAt: new Date(),
    };

    // CRITICAL FIX: To prevent E11000 duplicate key error on unique indexes,
    // we must not include these fields at all if they are empty strings.
    // MongoDB's unique index considers '' as a specific value, so multiple '' will clash.
    // Sparse indexes ignore fields that are missing.
    if (!doc.username || doc.username.trim() === "") {
      delete doc.username;
    } else {
      doc.username = doc.username.trim();
    }

    if (!doc.email || doc.email.trim() === "") {
      delete doc.email;
    } else {
      doc.email = doc.email.trim();
    }

    await db.collection('users').insertOne(doc);

    const user = await db.collection('users').findOne(
      { id: value.id },
      { projection: { password: 0, _id: 0 } }
    );

    res.status(201).json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------
// IMPORT USERS BULK
// ------------------------------------------------------------
const importSchema = Joi.object({
  users: Joi.array().items(createSchema).required()
});

export const importUsers = async (req, res) => {
  const { error, value } = importSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();
    const usersToImport = value.users;
    const errors = [];
    let importedCount = 0;

    // Prepare common password hash once
    const tempPwd = 'temp123';
    const hashed = await hashPassword(tempPwd);

    for (const userData of usersToImport) {
      try {
        const userId = String(userData.id).trim();
        const username = userData.username ? userData.username.trim() : "";
        const email = userData.email ? userData.email.trim() : "";

        // Build OR query based on what is provided
        // IMPORTANT: We only include checks for username/email if they are non-empty strings
        // to avoid matching multiple "unassigned" accounts against each other during the check.
        const checks = [{ id: userId }];
        if (username !== "") {
          checks.push({ username: username });
        }
        if (email !== "") {
          checks.push({ email: email });
        }

        // Check for existing ID, Username, or Email
        const existing = await db.collection('users').findOne({ $or: checks });

        if (existing) {
          errors.push({ id: userId, message: `Conflict: User with ID, Username, or Email '${userId}' already exists.` });
          continue; // Skip this user
        }

        const doc = {
          ...userData,
          id: userId,
          name: userData.name.trim(),
          username: username || '',
          email: email || '',
          password: hashed,
          passwordChanged: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // CRITICAL FIX: To prevent E11000 duplicate key error on { username: null } or { username: "" },
        // we must not include these fields at all if they are empty, PROVIDED the index is sparse.
        // If the index is NOT sparse, the database will still complain about multiple nulls.
        // For standard unique indexes, we force them to '' but that only allows ONE unassigned user.
        // The most robust way is to ensure the database index is sparse and omit empty fields.
        if (!doc.username || doc.username === "") delete doc.username;
        if (!doc.email || doc.email === "") delete doc.email;

        await db.collection('users').insertOne(doc);
        importedCount++;
      } catch (err) {
        console.error(`Error importing user ${userData.id}:`, err);
        errors.push({ id: userData.id, message: err.message || 'Database error during insertion' });
      }
    }

    res.status(201).json({
      message: 'Import process completed',
      importedCount,
      errors
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error during import' });
  }
};

// ------------------------------------------------------------
// GET CURRENT USER (ME) – FOR PROFILE
// ------------------------------------------------------------
export const getMe = async (req, res) => {
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne(
      { id: req.user.id },
      { projection: { password: 0, _id: 0 } }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------
// GET ALL USERS (admin)
// ------------------------------------------------------------
export const getUsers = async (req, res) => {
  try {
    const db = await connectDB();
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;

    const query = {
      $and: [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { id: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }, // Search by email
          ],
        },
        role ? { role } : {},
        status && status !== 'all' ? { status } : {},
      ],
    };

    const users = await db
      .collection('users')
      .find(query)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .project({ password: 0, _id: 0 })
      .toArray();

    const total = await db.collection('users').countDocuments(query);

    res.json({ users, total, page: +page, limit: +limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------
// UPDATE USER – ADMIN CANNOT BE DEACTIVATED
// ------------------------------------------------------------
const updateSchema = Joi.object({
  id: Joi.string().optional(), // Allow updating ID
  name: Joi.string().min(2).optional(),
  username: Joi.string().min(3).optional(),
  email: Joi.string().email().optional(), // Added Email
  role: Joi.string().valid('admin', 'librarian', 'teacher', 'student').optional(),
  department: Joi.string().allow('').optional(),
  status: Joi.string().valid('active', 'deactive').optional(),
});

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const db = await connectDB();

    const currentUser = await db.collection('users').findOne({ id });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    // BLOCK: Cannot change admin role
    if (currentUser.role === 'admin' && value.role && value.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot change admin role.' });
    }

    // BLOCK: Cannot deactivate admin
    if (currentUser.role === 'admin' && value.status === 'deactive') {
      return res.status(403).json({ message: 'Cannot deactivate admin account.' });
    }

    // Check ID uniqueness if changed
    if (value.id && value.id !== id) {
      const idExists = await db.collection('users').findOne({ id: value.id });
      if (idExists) return res.status(400).json({ message: 'ID already in use' });
    }

    // Username uniqueness
    if (value.username && value.username !== currentUser.username) {
      const exists = await db.collection('users').findOne({
        username: value.username,
        id: { $ne: id },
      });
      if (exists) return res.status(400).json({ message: 'Username already taken' });
    }

    // Email uniqueness
    if (value.email && value.email !== currentUser.email) {
      const exists = await db.collection('users').findOne({
        email: value.email,
        id: { $ne: id },
      });
      if (exists) return res.status(400).json({ message: 'Email already registered to another user' });
    }

    // FIX: Create update data with timestamp tracking for reports
    const updateData = { ...value };
    
    // Always update updatedAt timestamp (IMPORTANT for deactivated users report)
    updateData.updatedAt = new Date();
    
    // Track deactivation time specifically when status changes to 'deactive'
    if (value.status === 'deactive' && currentUser.status !== 'deactive') {
      updateData.deactivatedAt = new Date();
    }

    const result = await db.collection('users').findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after', projection: { password: 0, _id: 0 } }
    );

    // handle both older and newer MongoDB drivers
    const updatedUser = result.value || result;

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json(updatedUser);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------
// DELETE USER (non-admin only)
// ------------------------------------------------------------
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({ id });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin account.' });
    }

    await db.collection('users').deleteOne({ id });
    res.json({ message: 'User deleted successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};