// src/controllers/reportController.js
import { getWeeklyReport } from '../models/reportModel.js';
import { initReportModel } from '../models/reportModel.js';
import { connectDB } from '../config/db.js';

export const generateWeeklyReport = async (req, res) => {
  const { type } = req.params;               // users | news | books | deactive
  try {
    // Method 1: Using the legacy function (your existing code)
    const data = await getWeeklyReport(type);
    
    // Method 2: Using the model class (alternative)
    // const db = await connectDB();
    // const reportModel = initReportModel(db);
    // const data = await reportModel.getWeeklyReport(type);
    
    res.json({ 
      type, 
      weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), 
      data 
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
};

/**
 * NEW: Generate daily report
 */
export const generateDailyReport = async (req, res) => {
  const { collection, days = 7 } = req.query;
  
  if (!collection) {
    return res.status(400).json({ message: 'Collection parameter is required' });
  }

  try {
    const db = await connectDB();
    const reportModel = initReportModel(db);
    const data = await reportModel.getDailyReport(collection, parseInt(days));
    
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
};

/**
 * NEW: Generate monthly summary report
 */
export const generateMonthlySummary = async (req, res) => {
  const { year, month } = req.query;
  
  const currentDate = new Date();
  const targetYear = parseInt(year) || currentDate.getFullYear();
  const targetMonth = parseInt(month) || currentDate.getMonth() + 1;

  try {
    const db = await connectDB();
    const reportModel = initReportModel(db);
    const data = await reportModel.getMonthlySummaryReport(targetYear, targetMonth);
    
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
};

/**
 * NEW: Export report data
 */
export const exportReport = async (req, res) => {
  const { type, format = 'json' } = req.query;
  const options = req.body;
  
  if (!type) {
    return res.status(400).json({ message: 'Report type is required' });
  }

  try {
    const db = await connectDB();
    const reportModel = initReportModel(db);
    const data = await reportModel.exportReport(type, format, options);
    
    // Set appropriate headers based on format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report_${type}_${new Date().toISOString().slice(0,10)}.csv`);
    } else {
      res.setHeader('Content-Type', 'application/json');
    }
    
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
};

/**
 * NEW: Get user activity report
 */
export const getUserActivityReport = async (req, res) => {
  const { userId } = req.params;
  const { days = 30 } = req.query;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const db = await connectDB();
    const reportModel = initReportModel(db);
    const data = await reportModel.getUserActivityReport(userId, parseInt(days));
    
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
};

/**
 * NEW: Get system activity report
 */
export const getSystemActivityReport = async (req, res) => {
  const { days = 7 } = req.query;

  try {
    const db = await connectDB();
    const reportModel = initReportModel(db);
    const data = await reportModel.getSystemActivityReport(parseInt(days));
    
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
};