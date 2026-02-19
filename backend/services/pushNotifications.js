import { runQuery, getQuery, allQuery } from '../db.js';

export const savePushSubscription = async (userId, subscription) => {
  try {
    const subscriptionJson = JSON.stringify(subscription);
    
    const existing = await getQuery(
      'SELECT * FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, subscription.endpoint]
    );

    if (existing) {
      await runQuery(
        'UPDATE push_subscriptions SET subscription_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [subscriptionJson, existing.id]
      );
    } else {
      await runQuery(
        'INSERT INTO push_subscriptions (user_id, endpoint, subscription_data) VALUES (?, ?, ?)',
        [userId, subscription.endpoint, subscriptionJson]
      );
    }

    return true;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return false;
  }
};

export const sendPushNotification = async (userId, payload) => {
  try {
    const subscriptions = await allQuery(
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions for user ${userId}`);
      return false;
    }

    console.log(`Sending browser notification to user ${userId}: ${payload.title}`);
    console.log('In production, integrate with Web Push API (web-push npm package)');
    
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

export const removePushSubscription = async (userId, endpoint) => {
  try {
    await runQuery(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    );
    return true;
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return false;
  }
};