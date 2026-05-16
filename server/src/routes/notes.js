import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/database.js';
import { analyzeNote } from '../services/aiService.js';

const router = Router();

// Helper: get tags for a note
function getNoteTags(noteId) {
  return db.prepare(`
    SELECT t.id, t.name, t.color FROM tags t
    JOIN note_tags nt ON nt.tag_id = t.id
    WHERE nt.note_id = ?
  `).all(noteId);
}

// Helper: format note with tags
function formatNote(note) {
  if (!note) return null;
  return {
    ...note,
    tags: getNoteTags(note.id),
    ai_action_items: note.ai_action_items ? JSON.parse(note.ai_action_items) : null,
    is_archived: !!note.is_archived,
    is_public: !!note.is_public
  };
}

// GET /api/notes — List notes with search, filter, sort
router.get('/', (req, res) => {
  try {
    const { search, tag, category, sort = 'updated', archived } = req.query;
    const userId = req.user.id;

    let query = 'SELECT * FROM notes WHERE user_id = ?';
    const params = [userId];

    // Filter archived
    if (archived === 'true') {
      query += ' AND is_archived = 1';
    } else {
      query += ' AND is_archived = 0';
    }

    // Search
    if (search) {
      query += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Category filter
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    // Sort
    switch (sort) {
      case 'oldest':
        query += ' ORDER BY updated_at ASC';
        break;
      case 'alpha':
        query += ' ORDER BY title ASC';
        break;
      case 'created':
        query += ' ORDER BY created_at DESC';
        break;
      default:
        query += ' ORDER BY updated_at DESC';
    }

    let notes = db.prepare(query).all(...params);

    // Tag filter (post-query since it's a many-to-many)
    if (tag) {
      notes = notes.filter(note => {
        const tags = getNoteTags(note.id);
        return tags.some(t => t.name === tag || t.id === tag);
      });
    }

    res.json({ notes: notes.map(formatNote) });
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notes — Create note
router.post('/', (req, res) => {
  try {
    const { title, content, category, tags: tagIds } = req.body;
    const userId = req.user.id;
    const id = `NOTE_${nanoid(10)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO notes (id, user_id, title, content, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, title || 'Untitled', content || '', category || 'uncategorized', now, now);

    // Add tags
    if (tagIds && tagIds.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)');
      for (const tagId of tagIds) {
        insertTag.run(id, tagId);
      }
    }

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    res.status(201).json({ note: formatNote(note) });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notes/:id — Get single note
router.get('/:id', (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ note: formatNote(note) });
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notes/:id — Update note (auto-save)
router.patch('/:id', (req, res) => {
  try {
    const { title, content, category } = req.body;
    const now = new Date().toISOString();

    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(req.params.id);

    db.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // Update tags if provided
    if (req.body.tags !== undefined) {
      db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(req.params.id);
      const insertTag = db.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)');
      for (const tagId of req.body.tags) {
        insertTag.run(req.params.id, tagId);
      }
    }

    const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    res.json({ note: formatNote(updated) });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/notes/:id — Delete note
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notes/:id/archive — Toggle archive
router.patch('/:id/archive', (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const newState = note.is_archived ? 0 : 1;
    db.prepare('UPDATE notes SET is_archived = ?, updated_at = ? WHERE id = ?')
      .run(newState, new Date().toISOString(), req.params.id);

    const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    res.json({ note: formatNote(updated) });
  } catch (err) {
    console.error('Archive note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notes/:id/share — Toggle public share
router.post('/:id/share', (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.is_public) {
      // Make private
      db.prepare('UPDATE notes SET is_public = 0, share_id = NULL WHERE id = ?')
        .run(req.params.id);
    } else {
      // Make public
      const shareId = nanoid(12);
      db.prepare('UPDATE notes SET is_public = 1, share_id = ? WHERE id = ?')
        .run(shareId, req.params.id);
    }

    const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    res.json({ note: formatNote(updated) });
  } catch (err) {
    console.error('Share note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notes/:id/generate-summary — AI analysis
router.post('/:id/generate-summary', (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (!note.content || note.content.trim().length < 10) {
      return res.status(400).json({ error: 'Note content is too short for analysis' });
    }

    const result = analyzeNote(note.content);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE notes SET 
        ai_summary = ?, ai_action_items = ?, ai_suggested_title = ?, ai_generated_at = ?
      WHERE id = ?
    `).run(
      result.summary,
      JSON.stringify(result.action_items),
      result.suggested_title,
      now,
      req.params.id
    );

    // Track AI usage
    const usageId = `AI_${nanoid(10)}`;
    db.prepare('INSERT INTO ai_usage (id, user_id, note_id, action, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(usageId, req.user.id, req.params.id, 'full_analysis', now);

    const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    res.json({ note: formatNote(updated), analysis: result });
  } catch (err) {
    console.error('AI generation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
