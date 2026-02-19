import cron from 'node-cron';
import { allQuery, runQuery } from '../db.js';
import { sendReminderEmail, sendMissedReminderEmail, sendWeeklyReport } from './emailService.js';
import { updateStreak } from '../routes/completions.js';

const MISSED_THRESHOLD_MINUTES = 30;

export const startReminderScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      await checkAndTriggerReminders();
      await checkMissedReminders();
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });

  cron.schedule('0 9 * * 1', async () => {
    try {
      await sendWeeklyPerformanceReports();
    } catch (error) {
      console.error('Weekly report error:', error);
    }
  });

  console.log('Reminder scheduler initialized - checking every minute');
  console.log('Weekly report scheduler initialized - every Monday at 9 AM');
};

const checkAndTriggerReminders = async () => {
  try {
    const reminders = await allQuery(`
      SELECT r.*, u.email, u.name, u.timezone
      FROM reminders r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_active = 1
    `);

    const now = new Date();

    for (const reminder of reminders) {
      if (await shouldTriggerReminder(reminder, now)) {
        await triggerReminder(reminder);
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

const shouldTriggerReminder = async (reminder, now) => {
  try {
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: reminder.timezone }));
    
    const currentHours = userDate.getHours();
    const currentMinutes = userDate.getMinutes();
    const currentDay = userDate.getDay();
    
    const [reminderHours, reminderMinutes] = reminder.reminder_time.split(':').map(Number);
    
    if (currentHours !== reminderHours || currentMinutes !== reminderMinutes) {
      return false;
    }
    
    if (reminder.recurrence_type === 'weekly') {
      const weeklyDays = JSON.parse(reminder.weekly_days || '[]');
      if (!weeklyDays.includes(currentDay)) {
        return false;
      }
    }
    
    if (reminder.last_triggered) {
      const lastTriggered = new Date(reminder.last_triggered);
      const lastTriggeredUser = new Date(lastTriggered.toLocaleString('en-US', { timeZone: reminder.timezone }));
      
      const lastDate = lastTriggeredUser.toDateString();
      const currentDate = userDate.toDateString();
      
      if (lastDate === currentDate) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking if reminder should trigger:', error);
    return false;
  }
};

const triggerReminder = async (reminder) => {
  try {
    console.log(`Triggering reminder: ${reminder.title} for user ${reminder.email}`);
    
    await sendReminderEmail(reminder);
    
    await runQuery(
      'UPDATE reminders SET last_triggered = CURRENT_TIMESTAMP WHERE id = ?',
      [reminder.id]
    );
    
    const result = await runQuery(
      'INSERT INTO reminder_logs (reminder_id, user_id, status) VALUES (?, ?, ?)',
      [reminder.id, reminder.user_id, 'sent']
    );
    
    console.log(`Reminder sent successfully: ${reminder.title} (Log ID: ${result.id})`);
  } catch (error) {
    console.error('Error triggering reminder:', error);
    
    await runQuery(
      'INSERT INTO reminder_logs (reminder_id, user_id, status) VALUES (?, ?, ?)',
      [reminder.id, reminder.user_id, 'failed']
    );
  }
};

const checkMissedReminders = async () => {
  try {
    const thresholdTime = new Date(Date.now() - MISSED_THRESHOLD_MINUTES * 60 * 1000);
    
    const missedLogs = await allQuery(
      `SELECT rl.*, r.title, r.reminder_time, r.recurrence_type, u.email, u.name, u.timezone
       FROM reminder_logs rl
       JOIN reminders r ON rl.reminder_id = r.id
       JOIN users u ON rl.user_id = u.id
       LEFT JOIN reminder_completions rc ON rl.id = rc.log_id
       WHERE rl.triggered_at <= ? 
       AND rc.id IS NULL
       AND rl.status = 'sent'`,
      [thresholdTime.toISOString()]
    );

    for (const log of missedLogs) {
      await markAsMissed(log);
    }
  } catch (error) {
    console.error('Error checking missed reminders:', error);
  }
};

const markAsMissed = async (log) => {
  try {
    const existing = await allQuery(
      'SELECT * FROM reminder_completions WHERE log_id = ?',
      [log.id]
    );

    if (existing.length > 0) {
      return;
    }

    await runQuery(
      `INSERT INTO reminder_completions (reminder_id, user_id, log_id, scheduled_time, status)
       VALUES (?, ?, ?, ?, ?)`,
      [log.reminder_id, log.user_id, log.id, log.triggered_at, 'missed']
    );

    await updateStreak(log.reminder_id, log.user_id, false);

    await sendMissedReminderEmail({
      email: log.email,
      name: log.name,
      title: log.title,
      reminder_time: log.reminder_time,
      scheduled_time: log.triggered_at
    });

    console.log(`Marked as missed: ${log.title} for user ${log.email}`);
  } catch (error) {
    console.error('Error marking reminder as missed:', error);
  }
};

const sendWeeklyPerformanceReports = async () => {
  try {
    const users = await allQuery('SELECT * FROM users');

    for (const user of users) {
      await generateAndSendWeeklyReport(user);
    }
  } catch (error) {
    console.error('Error sending weekly reports:', error);
  }
};

const generateAndSendWeeklyReport = async (user) => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const stats = await allQuery(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
       FROM reminder_completions
       WHERE user_id = ? AND scheduled_time >= ?`,
      [user.id, weekStart.toISOString()]
    );

    const streaks = await allQuery(
      `SELECT us.*, r.title
       FROM user_streaks us
       JOIN reminders r ON us.reminder_id = r.id
       WHERE us.user_id = ?
       ORDER BY us.current_streak DESC`,
      [user.id]
    );

    const totalStreak = streaks.reduce((sum, s) => sum + (s.current_streak || 0), 0);
    const longestStreak = streaks.length > 0 ? streaks[0] : null;

    const reportData = {
      total: stats[0]?.total || 0,
      completed: stats[0]?.completed || 0,
      missed: stats[0]?.missed || 0,
      completionRate: stats[0]?.total > 0 
        ? ((stats[0].completed / stats[0].total) * 100).toFixed(1)
        : 0,
      totalStreak,
      longestStreak,
      streaks: streaks.slice(0, 5)
    };

    if (reportData.total > 0) {
      await runQuery(
        `INSERT INTO weekly_reports (user_id, week_start, week_end, total_reminders, completed_count, missed_count, completion_rate, report_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          weekStart.toISOString(),
          new Date().toISOString(),
          reportData.total,
          reportData.completed,
          reportData.missed,
          reportData.completionRate,
          JSON.stringify(reportData)
        ]
      );

      await sendWeeklyReport({
        email: user.email,
        name: user.name,
        ...reportData
      });

      console.log(`Weekly report sent to ${user.email}`);
    }
  } catch (error) {
    console.error(`Error generating weekly report for user ${user.id}:`, error);
  }
};