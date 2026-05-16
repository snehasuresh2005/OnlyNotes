import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/shared/:shareId — Public route (no auth)
router.get('/:shareId', (req, res) => {
  try {
    const note = db.prepare(`
      SELECT n.*, u.name as author_name 
      FROM notes n 
      JOIN users u ON n.user_id = u.id 
      WHERE n.share_id = ? AND n.is_public = 1
    `).get(req.params.shareId);

    if (!note) {
      return res.status(404).json({ error: 'Shared note not found or is no longer public' });
    }

    // Get tags
    const tags = db.prepare(`
      SELECT t.id, t.name, t.color FROM tags t
      JOIN note_tags nt ON nt.tag_id = t.id
      WHERE nt.note_id = ?
    `).all(note.id);

    res.json({
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        tags,
        ai_summary: note.ai_summary,
        ai_action_items: note.ai_action_items ? JSON.parse(note.ai_action_items) : null,
        author_name: note.author_name,
        created_at: note.created_at,
        updated_at: note.updated_at
      }
    });
  } catch (err) {
    console.error('Get shared note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
