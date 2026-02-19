import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          timezone TEXT DEFAULT 'UTC',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          reminder_time TEXT NOT NULL,
          recurrence_type TEXT NOT NULL CHECK(recurrence_type IN ('daily', 'weekly')),
          weekly_days TEXT,
          is_active BOOLEAN DEFAULT 1,
          last_triggered DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS reminder_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reminder_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'sent',
          FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS reminder_completions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reminder_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          log_id INTEGER,
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          scheduled_time DATETIME NOT NULL,
          status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'missed')),
          FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (log_id) REFERENCES reminder_logs(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS user_streaks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          reminder_id INTEGER NOT NULL,
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_completed DATETIME,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE,
          UNIQUE(user_id, reminder_id)
        )
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS weekly_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          week_start DATETIME NOT NULL,
          week_end DATETIME NOT NULL,
          total_reminders INTEGER DEFAULT 0,
          completed_count INTEGER DEFAULT 0,
          missed_count INTEGER DEFAULT 0,
          completion_rate REAL DEFAULT 0,
          report_data TEXT,
          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          endpoint TEXT NOT NULL,
          subscription_data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id)`, (err) => {
        if (err) reject(err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active)`, (err) => {
        if (err) reject(err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_completions_user_id ON reminder_completions(user_id)`, (err) => {
        if (err) reject(err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_completions_reminder_id ON reminder_completions(reminder_id)`, (err) => {
        if (err) reject(err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_completions_status ON reminder_completions(status)`, (err) => {
        if (err) reject(err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON user_streaks(user_id)`, (err) => {
        if (err) reject(err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_logs_user_id ON reminder_logs(user_id)`, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export default db;