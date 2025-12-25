// config/db.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { hashPassword } from '../utils/hash.js';

dotenv.config();

const uri = process.env.MONGODB_URI;
let client;
let db;

export async function connectDB() {
  if (db) {
    console.log('Using existing database connection');
    return db;
  }
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    // Get database name from URI
    const dbName = new URL(uri).pathname.replace('/', '') || 'libDB2';
    db = client.db(dbName);
    
    console.log(`✅ MongoDB connected to database: "${db.databaseName}"`);
    
    // Create admin user if it doesn't exist (runs only once)
    await createAdminUser(db);
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

// Create admin user on first startup
async function createAdminUser(db) {
  try {
    const usersCollection = db.collection('users');
    
    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ 
      id: '000000' 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Hash default password
    const hashedPassword = await hashPassword('admin123');
    
    // Create admin user WITHOUT username and email
    const adminUser = {
      id: '000000',
      name: 'Admin',
      role: 'admin',
      department: 'Administration',
      password: hashedPassword,
      passwordChanged: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await usersCollection.insertOne(adminUser);
    
    console.log('=========================================');
    console.log('✅ ADMIN USER CREATED SUCCESSFULLY');
    console.log('=========================================');
    console.log('ID: 000000');
    console.log('Password: admin123');
    console.log('Name: Admin');
    console.log('Role: admin');
    console.log('=========================================');
    console.log('Note: Admin will set username/email on first login');
    console.log('=========================================');
    
  } catch (error) {
    console.log('Note: Could not create admin user (might already exist):', error.message);
  }
}

export async function closeDB() {
  if (client) await client.close();
}