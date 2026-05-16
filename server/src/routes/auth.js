import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from '../db/database.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = `USR_${nanoid(10)}`;
    const password_hash = await bcrypt.hash(password, 12);

    db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)')
      .run(id, name, email.toLowerCase(), password_hash);

    const user = { id, name, email: email.toLowerCase() };
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login — accepts any email/password; creates account if new
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    if (!row) {
      const id = `USR_${nanoid(10)}`;
      const name = normalizedEmail.split('@')[0] || 'User';
      const password_hash = await bcrypt.hash(password, 12);
      db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)')
        .run(id, name, normalizedEmail, password_hash);
      row = { id, name, email: normalizedEmail };
    }

    const userData = { id: row.id, name: row.name, email: row.email };
    const token = generateToken(userData);

    res.json({ user: userData, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  // This route needs auth middleware applied externally
  res.json({ user: req.user });
});

export default router;
