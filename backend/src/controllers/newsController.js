// src/controllers/newsController.js
import { connectDB } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from "@google/genai";

const generateId = () => {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const r = uuidv4().slice(0, 8).toUpperCase();
  return `N-${d}-${r}`;
};

export const createNews = async (req, res) => {
  try {
    const { role, news } = req.body;
    if (!role || !news || news.trim().length < 5)
      return res.status(400).json({ message: 'Role and news (min 5 chars) required' });

    const db = await connectDB();

    const n = {
      id: generateId(),
      role: role === 'all' ? ['librarian', 'teacher', 'student'] : [role],
      news: news.trim(),
      createdAt: new Date(),
      readBy: [],
    };

    await db.collection('news').insertOne(n);

    res.status(201).json({ message: 'News posted', news: n });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getNews = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search = '' } = req.query;
    const db = await connectDB();

    const query = {
      role: { $in: [role] },
      news: { $regex: search, $options: 'i' },
    };

    const news = await db
      .collection('news')
      .find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .toArray();

    const total = await db.collection('news').countDocuments(query);

    res.json({ news, total, page: +page, limit: +limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const { role, userId } = req.query;

    if (!role || !userId) {
      return res.status(400).json({ message: 'role and userId required' });
    }

    const db = await connectDB();

    const count = await db.collection('news').countDocuments({
      role: { $in: [role] },
      readBy: { $nin: [userId] },
    });

    res.json({ count });
  } catch (e) {
    console.error('Unread count error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markNewsAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const db = await connectDB();

    await db.collection('news').updateMany(
      { readBy: { $nin: [userId] } },
      { $addToSet: { readBy: userId } }
    );

    res.json({ message: 'News marked as read' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const generateIdeas = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required' });

    const apiKey = process.env.API_KEY;

    // Check if key is missing or is still the default placeholder
    if (!apiKey || apiKey.includes('your_gemini_api_key')) {
        return res.status(500).json({ 
          message: 'Invalid API Configuration. Please replace "your_gemini_api_key_here" with a valid API key in backend/.env' 
        });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Prompt for 3 ideas in JSON format
    const prompt = `Generate 3 catchy news post titles and short summaries (1-2 sentences) for a library announcement about: "${topic}". 
    Return the response strictly in JSON format with an array of objects under the key "ideas", where each object has "title" and "summary" properties.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    let data;
    try {
        data = JSON.parse(text);
    } catch (parseError) {
        data = { ideas: [] };
    }
    
    const ideas = Array.isArray(data) ? data : (data.ideas || []);

    res.json({ ideas });
  } catch (e) {
    console.error('AI Generation Error:', e);
    // Return the specific error message from Google if available, or a generic one
    const msg = e.response?.data?.error?.message || e.message || 'Failed to generate ideas';
    res.status(500).json({ message: msg });
  }
};