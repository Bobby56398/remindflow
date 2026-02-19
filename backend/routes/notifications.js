import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { savePushSubscription, removePushSubscription } from '../services/pushNotifications.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    const success = await savePushSubscription(req.user.id, subscription);

    if (success) {
      res.json({ message: 'Subscription saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save subscription' });
    }
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }

    const success = await removePushSubscription(req.user.id, endpoint);

    if (success) {
      res.json({ message: 'Unsubscribed successfully' });
    } else {
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;