import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/database.js';

const router = Router();

const TAG_COLORS = [
  '#6C63FF', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF',
  '#FF8B94', '#B5EAD7', '#C7CEEA', '#FFDAC1', '#E2F0CB',
  '#DCD3FF', '#FFB7B2', '#97C1A9', '#FCB9AA', '#89ABE3'
];

// GET /api/tags
router.get('/', (req, res) => {
  try {
    const tags = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name')
      .all(req.user.id);
    res.json({ tags });
  } catch (err) {
    console.error('Get tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tags
router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const existing = db.prepare('SELECT id FROM tags WHERE name = ? AND user_id = ?')
      .get(name.trim().toLowerCase(), req.user.id);

    if (existing) {
      return res.status(409).json({ error: 'Tag already exists' });
    }

    const id = `TAG_${nanoid(8)}`;
    const tagColor = color || TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];

    db.prepare('INSERT INTO tags (id, name, user_id, color) VALUES (?, ?, ?, ?)')
      .run(id, name.trim().toLowerCase(), req.user.id, tagColor);

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    res.status(201).json({ tag });
  } catch (err) {
    console.error('Create tag error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tags/:id
router.delete('/:id', (req, res) => {
  try {
    // Remove tag associations
    db.prepare('DELETE FROM note_tags WHERE tag_id = ?').run(req.params.id);
    const result = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete tag error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
