import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
});

export const sendReminderEmail = async (reminder) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"RemindMe" <noreply@remindme.app>',
      to: reminder.email,
      subject: `Reminder: ${reminder.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .reminder-title {
              font-size: 24px;
              font-weight: bold;
              color: #667eea;
              margin-bottom: 10px;
            }
            .reminder-description {
              color: #666;
              margin-bottom: 20px;
            }
            .reminder-details {
              background: #f0f0f0;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>RemindMe</h1>
              <p>Your reminder is here!</p>
            </div>
            <div class="content">
              <p>Hi ${reminder.name},</p>
              <div class="reminder-title">${reminder.title}</div>
              ${reminder.description ? `<div class="reminder-description">${reminder.description}</div>` : ''}
              <div class="reminder-details">
                <strong>Time:</strong> ${reminder.reminder_time}<br>
                <strong>Recurrence:</strong> ${reminder.recurrence_type === 'daily' ? 'Daily' : 'Weekly'}
                ${reminder.recurrence_type === 'weekly' ? `<br><strong>Days:</strong> ${getWeeklyDaysString(reminder.weekly_days)}` : ''}
              </div>
              <p style="margin-top: 20px;">
                Have a great day!<br>
                - RemindMe Team
              </p>
            </div>
            <div class="footer">
              <p>This is an automated reminder from RemindMe. You can manage your reminders in the app.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    if (process.env.NODE_ENV === 'production' && process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${reminder.email}`);
    } else {
      console.log('Email sending simulated (configure SMTP in production):');
      console.log(`To: ${reminder.email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Reminder: ${reminder.title}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const getWeeklyDaysString = (weeklyDays) => {
  if (!weeklyDays) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const selectedDays = JSON.parse(weeklyDays);
  return selectedDays.map(d => days[d]).join(', ');
};

export const sendMissedReminderEmail = async (data) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"RemindMe" <noreply@remindme.app>',
      to: data.email,
      subject: `Missed Reminder: ${data.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .reminder-title {
              font-size: 24px;
              font-weight: bold;
              color: #ef4444;
              margin-bottom: 10px;
            }
            .warning-box {
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>RemindMe</h1>
              <p>You missed a reminder</p>
            </div>
            <div class="content">
              <p>Hi ${data.name},</p>
              <div class="reminder-title">${data.title}</div>
              <div class="warning-box">
                <strong>Status:</strong> Missed<br>
                <strong>Scheduled Time:</strong> ${data.reminder_time}<br>
                <strong>Note:</strong> This reminder was not completed within the expected timeframe.
              </div>
              <p>Your streak for this reminder has been reset. Don't worry, you can start building it again!</p>
              <p style="margin-top: 20px;">
                Stay on track with your goals!<br>
                - RemindMe Team
              </p>
            </div>
            <div class="footer">
              <p>This is an automated notification from RemindMe.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    if (process.env.NODE_ENV === 'production' && process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`Missed reminder email sent to ${data.email}`);
    } else {
      console.log('Missed reminder email simulated:');
      console.log(`To: ${data.email}`);
      console.log(`Subject: ${mailOptions.subject}`);
    }
  } catch (error) {
    console.error('Error sending missed reminder email:', error);
  }
};

export const sendWeeklyReport = async (data) => {
  try {
    const topStreaksHtml = data.streaks && data.streaks.length > 0
      ? data.streaks.map(s => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${s.title}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: #667eea;">${s.current_streak}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="2" style="padding: 10px; text-align: center; color: #999;">No active streaks yet</td></tr>';

    const mailOptions = {
      from: process.env.SMTP_FROM || '"RemindMe" <noreply@remindme.app>',
      to: data.email,
      subject: 'Your Weekly Performance Report',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .stat-card {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .stat-number {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              margin: 10px 0;
            }
            .stat-label {
              color: #666;
              font-size: 14px;
            }
            .completion-bar {
              background: #e5e7eb;
              height: 30px;
              border-radius: 15px;
              overflow: hidden;
              margin: 20px 0;
            }
            .completion-fill {
              background: linear-gradient(90deg, #10b981 0%, #059669 100%);
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
            }
            .streak-table {
              width: 100%;
              margin: 20px 0;
              border-collapse: collapse;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Weekly Performance Report</h1>
              <p>Your RemindMe Summary</p>
            </div>
            <div class="content">
              <p>Hi ${data.name},</p>
              <p>Here's your weekly performance summary:</p>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Total Reminders</div>
                  <div class="stat-number">${data.total}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Completed</div>
                  <div class="stat-number" style="color: #10b981;">${data.completed}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Missed</div>
                  <div class="stat-number" style="color: #ef4444;">${data.missed}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Total Streak</div>
                  <div class="stat-number" style="color: #f59e0b;">${data.totalStreak}</div>
                </div>
              </div>

              <h3 style="margin-top: 30px;">Completion Rate</h3>
              <div class="completion-bar">
                <div class="completion-fill" style="width: ${data.completionRate}%">
                  ${data.completionRate}%
                </div>
              </div>

              ${data.longestStreak ? `
                <h3 style="margin-top: 30px;">Longest Current Streak</h3>
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                  <strong>${data.longestStreak.title}</strong><br>
                  <span style="color: #f59e0b; font-size: 24px; font-weight: bold;">${data.longestStreak.current_streak} days</span>
                </div>
              ` : ''}

              <h3 style="margin-top: 30px;">Top Streaks</h3>
              <table class="streak-table">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 10px; text-align: left;">Reminder</th>
                    <th style="padding: 10px; text-align: center;">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  ${topStreaksHtml}
                </tbody>
              </table>

              <p style="margin-top: 30px;">
                ${data.completionRate >= 80 
                  ? 'Excellent work! Keep up the great consistency!' 
                  : data.completionRate >= 60
                  ? 'Good job! Try to complete more reminders this week.'
                  : 'You can do better! Focus on building consistent habits.'}
              </p>

              <p style="margin-top: 20px;">
                Keep building those streaks!<br>
                - RemindMe Team
              </p>
            </div>
            <div class="footer">
              <p>This is your weekly automated report from RemindMe.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    if (process.env.NODE_ENV === 'production' && process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`Weekly report sent to ${data.email}`);
    } else {
      console.log('Weekly report email simulated:');
      console.log(`To: ${data.email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Completion Rate: ${data.completionRate}%`);
    }
  } catch (error) {
    console.error('Error sending weekly report:', error);
  }
};

export default { sendReminderEmail, sendMissedReminderEmail, sendWeeklyReport };