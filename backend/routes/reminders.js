import express from 'express';
import { runQuery, getQuery, allQuery } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const reminders = await allQuery(
      'SELECT * FROM reminders WHERE user_id = ? ORDER BY reminder_time ASC',
      [req.user.id]
    );

    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const reminder = await getQuery(
      'SELECT * FROM reminders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json(reminder);
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, reminder_time, recurrence_type, weekly_days, is_active } = req.body;

    if (!title || !reminder_time || !recurrence_type) {
      return res.status(400).json({ error: 'Title, time, and recurrence type are required' });
    }

    if (!['daily', 'weekly'].includes(recurrence_type)) {
      return res.status(400).json({ error: 'Invalid recurrence type' });
    }

    if (recurrence_type === 'weekly' && !weekly_days) {
      return res.status(400).json({ error: 'Weekly days are required for weekly reminders' });
    }

    const result = await runQuery(
      `INSERT INTO reminders (user_id, title, description, reminder_time, recurrence_type, weekly_days, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        description || null,
        reminder_time,
        recurrence_type,
        weekly_days || null,
        is_active !== undefined ? is_active : 1
      ]
    );

    const reminder = await getQuery('SELECT * FROM reminders WHERE id = ?', [result.id]);

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, reminder_time, recurrence_type, weekly_days, is_active } = req.body;

    const existing = await getQuery(
      'SELECT * FROM reminders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (reminder_time !== undefined) {
      updates.push('reminder_time = ?');
      values.push(reminder_time);
    }
    if (recurrence_type !== undefined) {
      updates.push('recurrence_type = ?');
      values.push(recurrence_type);
    }
    if (weekly_days !== undefined) {
      updates.push('weekly_days = ?');
      values.push(weekly_days);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id, req.user.id);

    await runQuery(
      `UPDATE reminders SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    const reminder = await getQuery('SELECT * FROM reminders WHERE id = ?', [req.params.id]);

    res.json({
      message: 'Reminder updated successfully',
      reminder
    });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery(
      'DELETE FROM reminders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;