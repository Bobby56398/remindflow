import express from 'express';
import { getQuery, allQuery } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/weekly', async (req, res) => {
  try {
    const reports = await allQuery(
      `SELECT * FROM weekly_reports 
       WHERE user_id = ?
       ORDER BY week_start DESC
       LIMIT 12`,
      [req.user.id]
    );

    res.json(reports);
  } catch (error) {
    console.error('Get weekly reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/weekly/latest', async (req, res) => {
  try {
    const report = await getQuery(
      `SELECT * FROM weekly_reports 
       WHERE user_id = ?
       ORDER BY week_start DESC
       LIMIT 1`,
      [req.user.id]
    );

    res.json(report || null);
  } catch (error) {
    console.error('Get latest weekly report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;