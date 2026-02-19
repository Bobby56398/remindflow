import express from 'express';
import cors from 'cors';
import compression from 'compression';
import authRoutes from './routes/auth.js';
import reminderRoutes from './routes/reminders.js';
import completionRoutes from './routes/completions.js';
import analyticsRoutes from './routes/analytics.js';
import reportsRoutes from './routes/reports.js';
import suggestionsRoutes from './routes/suggestions.js';
import notificationsRoutes from './routes/notifications.js';
import { initializeDatabase } from './db.js';
import { startReminderScheduler } from './services/scheduler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/completions', completionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RemindMe API is running' });
});

initializeDatabase().then(() => {
  console.log('Database initialized successfully');
  
  startReminderScheduler();
  console.log('Reminder scheduler started');
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});