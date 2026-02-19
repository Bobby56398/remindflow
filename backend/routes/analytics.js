import express from 'express';
import { getQuery, allQuery } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/overview', async (req, res) => {
  try {
    const totalReminders = await getQuery(
      'SELECT COUNT(*) as count FROM reminders WHERE user_id = ? AND is_active = 1',
      [req.user.id]
    );

    const completions = await getQuery(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
       FROM reminder_completions
       WHERE user_id = ?`,
      [req.user.id]
    );

    const completionRate = completions.total > 0 
      ? (completions.completed / completions.total * 100).toFixed(1)
      : 0;

    const totalStreak = await getQuery(
      'SELECT SUM(current_streak) as total FROM user_streaks WHERE user_id = ?',
      [req.user.id]
    );

    const topStreak = await getQuery(
      `SELECT us.*, r.title 
       FROM user_streaks us
       JOIN reminders r ON us.reminder_id = r.id
       WHERE us.user_id = ?
       ORDER BY us.current_streak DESC
       LIMIT 1`,
      [req.user.id]
    );

    res.json({
      totalActiveReminders: totalReminders.count || 0,
      totalCompletions: completions.completed || 0,
      totalMissed: completions.missed || 0,
      completionRate: parseFloat(completionRate),
      totalStreak: totalStreak.total || 0,
      topStreak: topStreak || null
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/weekly', async (req, res) => {
  try {
    const weeklyData = await allQuery(
      `SELECT 
        DATE(scheduled_time) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
       FROM reminder_completions
       WHERE user_id = ? 
       AND scheduled_time >= datetime('now', '-7 days')
       GROUP BY DATE(scheduled_time)
       ORDER BY date ASC`,
      [req.user.id]
    );

    const formatted = weeklyData.map(day => ({
      date: day.date,
      total: day.total,
      completed: day.completed,
      missed: day.missed,
      completionRate: day.total > 0 ? (day.completed / day.total * 100).toFixed(1) : 0
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get weekly analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/monthly', async (req, res) => {
  try {
    const monthlyData = await allQuery(
      `SELECT 
        strftime('%Y-%m-%d', scheduled_time) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
       FROM reminder_completions
       WHERE user_id = ? 
       AND scheduled_time >= datetime('now', '-30 days')
       GROUP BY strftime('%Y-%m-%d', scheduled_time)
       ORDER BY date ASC`,
      [req.user.id]
    );

    const formatted = monthlyData.map(day => ({
      date: day.date,
      total: day.total,
      completed: day.completed,
      missed: day.missed,
      completionRate: day.total > 0 ? (day.completed / day.total * 100).toFixed(1) : 0
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get monthly analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reminder/:reminderId', async (req, res) => {
  try {
    const stats = await getQuery(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
       FROM reminder_completions
       WHERE user_id = ? AND reminder_id = ?`,
      [req.user.id, req.params.reminderId]
    );

    const streak = await getQuery(
      'SELECT * FROM user_streaks WHERE user_id = ? AND reminder_id = ?',
      [req.user.id, req.params.reminderId]
    );

    const recent = await allQuery(
      `SELECT * FROM reminder_completions
       WHERE user_id = ? AND reminder_id = ?
       ORDER BY scheduled_time DESC
       LIMIT 10`,
      [req.user.id, req.params.reminderId]
    );

    res.json({
      total: stats.total || 0,
      completed: stats.completed || 0,
      missed: stats.missed || 0,
      completionRate: stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : 0,
      streak: streak || { current_streak: 0, longest_streak: 0 },
      recentCompletions: recent
    });
  } catch (error) {
    console.error('Get reminder analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;