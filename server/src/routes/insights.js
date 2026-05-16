import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/insights — Productivity dashboard data
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;

    // Total notes
    const totalNotes = db.prepare('SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND is_archived = 0')
      .get(userId).count;

    // Archived notes
    const archivedNotes = db.prepare('SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND is_archived = 1')
      .get(userId).count;

    // Shared notes
    const sharedNotes = db.prepare('SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND is_public = 1')
      .get(userId).count;

    // Recently edited (last 7 days)
    const recentNotes = db.prepare(`
      SELECT id, title, updated_at, category FROM notes 
      WHERE user_id = ? AND is_archived = 0 
        AND updated_at >= datetime('now', '-7 days')
      ORDER BY updated_at DESC LIMIT 10
    `).all(userId);

    // Most used tags
    const topTags = db.prepare(`
      SELECT t.name, t.color, COUNT(nt.note_id) as usage_count
      FROM tags t
      LEFT JOIN note_tags nt ON t.id = nt.tag_id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY usage_count DESC
      LIMIT 10
    `).all(userId);

    // AI usage stats
    const totalAiUsage = db.prepare('SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ?')
      .get(userId).count;

    const aiUsageThisWeek = db.prepare(`
      SELECT COUNT(*) as count FROM ai_usage 
      WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
    `).get(userId).count;

    // AI usage by action
    const aiByAction = db.prepare(`
      SELECT action, COUNT(*) as count FROM ai_usage 
      WHERE user_id = ? GROUP BY action
    `).all(userId);

    // Notes by category
    const notesByCategory = db.prepare(`
      SELECT category, COUNT(*) as count FROM notes 
      WHERE user_id = ? AND is_archived = 0
      GROUP BY category ORDER BY count DESC
    `).all(userId);

    // Weekly activity (notes created/updated per day, last 7 days)
    const weeklyActivity = db.prepare(`
      SELECT 
        date(updated_at) as date,
        COUNT(*) as count
      FROM notes 
      WHERE user_id = ? AND updated_at >= datetime('now', '-7 days')
      GROUP BY date(updated_at)
      ORDER BY date ASC
    `).all(userId);

    // Notes created over time (last 30 days, grouped by day)
    const creationTrend = db.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as count
      FROM notes 
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all(userId);

    res.json({
      totalNotes,
      archivedNotes,
      sharedNotes,
      recentNotes,
      topTags,
      aiUsage: {
        total: totalAiUsage,
        thisWeek: aiUsageThisWeek,
        byAction: aiByAction
      },
      notesByCategory,
      weeklyActivity,
      creationTrend
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
