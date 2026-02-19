import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  analyzeOptimalTimes, 
  generateSmartReschedule,
  analyzeProductivityPatterns 
} from '../services/aiSuggestions.js';
import { runQuery, getQuery } from '../db.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/optimal-times', async (req, res) => {
  try {
    const { reminderId } = req.query;
    const suggestions = await analyzeOptimalTimes(
      req.user.id, 
      reminderId ? parseInt(reminderId) : null
    );

    res.json(suggestions);
  } catch (error) {
    console.error('Get optimal times error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reschedule/:reminderId', async (req, res) => {
  try {
    const { reminderId } = req.params;
    
    const reminder = await getQuery(
      'SELECT * FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, req.user.id]
    );

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const suggestion = await generateSmartReschedule(
      req.user.id,
      parseInt(reminderId),
      reminder.reminder_time
    );

    if (!suggestion) {
      return res.json({ 
        shouldReschedule: false, 
        message: 'No reschedule needed' 
      });
    }

    res.json(suggestion);
  } catch (error) {
    console.error('Generate reschedule suggestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/apply-reschedule/:reminderId', async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { newTime } = req.body;

    if (!newTime) {
      return res.status(400).json({ error: 'New time is required' });
    }

    await runQuery(
      'UPDATE reminders SET reminder_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [newTime, reminderId, req.user.id]
    );

    res.json({ 
      message: 'Reminder rescheduled successfully',
      newTime 
    });
  } catch (error) {
    console.error('Apply reschedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/productivity-insights', async (req, res) => {
  try {
    const insights = await analyzeProductivityPatterns(req.user.id);
    
    if (!insights) {
      return res.json({
        bestDays: [],
        bestHours: [],
        message: 'Not enough data yet'
      });
    }

    res.json(insights);
  } catch (error) {
    console.error('Get productivity insights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;