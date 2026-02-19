import express from 'express';
import { runQuery, getQuery, allQuery } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/:logId/complete', async (req, res) => {
  try {
    const { logId } = req.params;
    
    const log = await getQuery(
      'SELECT * FROM reminder_logs WHERE id = ? AND user_id = ?',
      [logId, req.user.id]
    );

    if (!log) {
      return res.status(404).json({ error: 'Reminder log not found' });
    }

    const existing = await getQuery(
      'SELECT * FROM reminder_completions WHERE log_id = ?',
      [logId]
    );

    if (existing) {
      return res.status(400).json({ error: 'Already marked as completed' });
    }

    const result = await runQuery(
      `INSERT INTO reminder_completions (reminder_id, user_id, log_id, scheduled_time, status)
       VALUES (?, ?, ?, ?, ?)`,
      [log.reminder_id, req.user.id, logId, log.triggered_at, 'completed']
    );

    await updateStreak(log.reminder_id, req.user.id, true);

    res.json({
      message: 'Reminder marked as completed',
      completion: {
        id: result.id,
        reminder_id: log.reminder_id,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('Complete reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/history/:reminderId', async (req, res) => {
  try {
    const completions = await allQuery(
      `SELECT * FROM reminder_completions 
       WHERE reminder_id = ? AND user_id = ?
       ORDER BY scheduled_time DESC
       LIMIT 100`,
      [req.params.reminderId, req.user.id]
    );

    res.json(completions);
  } catch (error) {
    console.error('Get completion history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const pending = await allQuery(
      `SELECT rl.*, r.title, r.reminder_time, r.recurrence_type
       FROM reminder_logs rl
       JOIN reminders r ON rl.reminder_id = r.id
       LEFT JOIN reminder_completions rc ON rl.id = rc.log_id
       WHERE rl.user_id = ? AND rc.id IS NULL
       ORDER BY rl.triggered_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json(pending);
  } catch (error) {
    console.error('Get pending completions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/streak/:reminderId', async (req, res) => {
  try {
    let streak = await getQuery(
      'SELECT * FROM user_streaks WHERE user_id = ? AND reminder_id = ?',
      [req.user.id, req.params.reminderId]
    );

    if (!streak) {
      const result = await runQuery(
        'INSERT INTO user_streaks (user_id, reminder_id) VALUES (?, ?)',
        [req.user.id, req.params.reminderId]
      );
      
      streak = {
        id: result.id,
        user_id: req.user.id,
        reminder_id: parseInt(req.params.reminderId),
        current_streak: 0,
        longest_streak: 0,
        last_completed: null
      };
    }

    res.json(streak);
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/streaks', async (req, res) => {
  try {
    const streaks = await allQuery(
      `SELECT us.*, r.title, r.recurrence_type
       FROM user_streaks us
       JOIN reminders r ON us.reminder_id = r.id
       WHERE us.user_id = ?
       ORDER BY us.current_streak DESC`,
      [req.user.id]
    );

    res.json(streaks);
  } catch (error) {
    console.error('Get all streaks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function updateStreak(reminderId, userId, completed) {
  try {
    const reminder = await getQuery('SELECT * FROM reminders WHERE id = ?', [reminderId]);
    if (!reminder) return;

    let streak = await getQuery(
      'SELECT * FROM user_streaks WHERE user_id = ? AND reminder_id = ?',
      [userId, reminderId]
    );

    if (!streak) {
      await runQuery(
        'INSERT INTO user_streaks (user_id, reminder_id) VALUES (?, ?)',
        [userId, reminderId]
      );
      streak = await getQuery(
        'SELECT * FROM user_streaks WHERE user_id = ? AND reminder_id = ?',
        [userId, reminderId]
      );
    }

    if (completed) {
      const newStreak = (streak.current_streak || 0) + 1;
      const longestStreak = Math.max(newStreak, streak.longest_streak || 0);

      await runQuery(
        `UPDATE user_streaks 
         SET current_streak = ?, longest_streak = ?, last_completed = CURRENT_TIMESTAMP, last_updated = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newStreak, longestStreak, streak.id]
      );
    } else {
      await runQuery(
        `UPDATE user_streaks 
         SET current_streak = 0, last_updated = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [streak.id]
      );
    }
  } catch (error) {
    console.error('Update streak error:', error);
  }
}

export { updateStreak };
export default router;