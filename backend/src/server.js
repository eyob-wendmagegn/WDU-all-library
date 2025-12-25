// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import bookRoutes from './routes/books.js';
import borrowRoutes from './routes/borrows.js';
import commentRoutes from './routes/commentRoutes.js';
import newsRoutes from './routes/news.js';
import paymentRoutes from './routes/payments.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import profileRoutes from './routes/profiles.js';
import translationRoutes from './routes/translationRoutes.js';
import telegramRoutes from './routes/telegram.js';
import { connectDB } from './config/db.js';

dotenv.config();

// First, connect to database
console.log('🔄 Connecting to database...');
await connectDB();
console.log('✅ Database connection established');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// INCREASED LIMIT TO 50MB to handle Chat History with Images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/telegram', telegramRoutes);

// Simple home route
app.get('/', (req, res) => {
  res.send(`
    <div style="text-align: center; margin-top: 50px; font-family: Arial;">
      <h1>📚 Woldia University Library System</h1>
      <p>Backend is running successfully</p>
      <p>Database: libDB2</p>
      <p>Admin ID: <strong>000000</strong></p>
    </div>
  `);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('=========================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('=========================================');
  console.log('📁 API Endpoints:');
  console.log('  /api/auth      - Authentication');
  console.log('  /api/users     - User management');
  console.log('  /api/books     - Book management');
  console.log('  /api/borrows   - Borrow system');
  console.log('  /api/comments  - Feedback system');
  console.log('=========================================');
});