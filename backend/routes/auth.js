import express from 'express';
import bcrypt from 'bcryptjs';
import { runQuery, getQuery } from '../db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, timezone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await runQuery(
      'INSERT INTO users (name, email, password, timezone) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, timezone || 'UTC']
    );

    const user = {
      id: result.id,
      name,
      email,
      timezone: timezone || 'UTC'
    };

    const token = generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone
    };

    const token = generateToken(userResponse);

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery(
      'SELECT id, name, email, timezone FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;