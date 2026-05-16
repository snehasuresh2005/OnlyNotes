import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import noteRoutes from './routes/notes.js';
import tagRoutes from './routes/tags.js';
import sharedRoutes from './routes/shared.js';
import insightRoutes from './routes/insights.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/shared', sharedRoutes);

// Protected routes
app.use('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
app.use('/api/notes', authMiddleware, noteRoutes);
app.use('/api/tags', authMiddleware, tagRoutes);
app.use('/api/insights', authMiddleware, insightRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 OnlyNotes Server running on http://localhost:${PORT}\n`);
});
