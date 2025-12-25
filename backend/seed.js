import { MongoClient } from 'mongodb';
import { hashPassword } from './src/utils/hash.js';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function seed() {
  try {
    await client.connect();
    const db = client.db();

    const users = [
      {
        username: 'WDU_ADMIN',
        id: '000000',
        name: 'Admin',
        role: 'admin',
        department: 'Administration',
      },
      {
        username: 'WDU_LIBRERIAN',
        id: '000001',
        name: 'tesema',
        role: 'librarian',
        department: 'library',
      },
      {
        username: 'WDU_TEACHER',
        id: '000002',
        name: 'negash',
        role: 'teacher',
        department: 'software',
      },
      {
        username: 'WDU_STUDENT',
        id: '000003',
        name: 'belay',
        role: 'student',
        department: 'computer science',
      },
    ];

    const hashedUsers = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await hashPassword(u.id),
        passwordChanged: false,
      }))
    );

    await db.collection('users').deleteMany({});
    const result = await db.collection('users').insertMany(hashedUsers);
    console.log(`${result.insertedCount} users seeded successfully!`);
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await client.close();
  }
}

seed();