# RemindMe Backend API

Backend service for the RemindMe SaaS application - a full-stack reminder management system with email notifications.

## Features

- User authentication with JWT
- Password hashing with bcrypt
- SQLite database
- RESTful API endpoints
- Cron-based reminder scheduler (checks every minute)
- Email notifications via SMTP
- Timezone support for accurate reminder delivery

## Tech Stack

- **Runtime**: Node.js (ESM modules)
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT + bcryptjs
- **Scheduler**: node-cron
- **Email**: nodemailer

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `timezone` - User's timezone (default: UTC)
- `created_at` - Timestamp

### Reminders Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Reminder title
- `description` - Optional description
- `reminder_time` - Time in HH:MM format
- `recurrence_type` - 'daily' or 'weekly'
- `weekly_days` - JSON array of day indices (0-6) for weekly reminders
- `is_active` - Boolean flag
- `last_triggered` - Last execution timestamp
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Reminder Logs Table
- `id` - Primary key
- `reminder_id` - Foreign key to reminders
- `user_id` - Foreign key to users
- `triggered_at` - Timestamp
- `status` - 'sent' or 'failed'

## API Endpoints

### Authentication

**POST** `/api/auth/signup`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "timezone": "America/New_York"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**GET** `/api/auth/verify`
- Headers: `Authorization: Bearer <token>`

### Reminders

**GET** `/api/reminders`
- Get all reminders for authenticated user
- Headers: `Authorization: Bearer <token>`

**GET** `/api/reminders/:id`
- Get specific reminder
- Headers: `Authorization: Bearer <token>`

**POST** `/api/reminders`
```json
{
  "title": "Morning Exercise",
  "description": "30 minutes cardio",
  "reminder_time": "07:00",
  "recurrence_type": "daily",
  "is_active": true
}
```

**POST** `/api/reminders` (Weekly Example)
```json
{
  "title": "Team Meeting",
  "description": "Weekly standup",
  "reminder_time": "10:00",
  "recurrence_type": "weekly",
  "weekly_days": "[1, 3, 5]",
  "is_active": true
}
```

**PUT** `/api/reminders/:id`
- Update reminder (partial updates supported)
- Headers: `Authorization: Bearer <token>`

**DELETE** `/api/reminders/:id`
- Delete reminder
- Headers: `Authorization: Bearer <token>`

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="RemindMe" <noreply@remindme.app>
```

## Email Configuration

### Gmail Setup
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated password in `SMTP_PASS`

### Other SMTP Providers
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **AWS SES**: Configure with your region
- **Outlook**: `smtp-mail.outlook.com:587`

## Scheduler Logic

The scheduler runs every minute and:

1. Fetches all active reminders with user timezone info
2. Converts current time to user's timezone
3. Checks if reminder time matches current time
4. For weekly reminders, validates the day of week
5. Prevents duplicate sends by checking `last_triggered`
6. Sends email notification via SMTP
7. Logs the event to `reminder_logs` table

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run in production mode
npm start
```

## Production Deployment

### Prerequisites
- Node.js 18+
- SMTP credentials

### Steps

1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env` file with production values
4. Start server: `npm start`

### Platform-Specific

**Heroku**
```bash
heroku create your-app-name
heroku config:set JWT_SECRET=your-secret
heroku config:set SMTP_USER=your-email
heroku config:set SMTP_PASS=your-password
git push heroku main
```

**Railway**
- Connect GitHub repo
- Set environment variables in dashboard
- Deploy automatically

**DigitalOcean App Platform**
- Connect GitHub repo
- Configure environment variables
- Set run command: `npm start`

**AWS EC2**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd backend
npm install
npm install -g pm2

# Create .env file
nano .env

# Start with PM2
pm2 start server.js --name remindme
pm2 save
pm2 startup
```

## Security Notes

- Change `JWT_SECRET` in production
- Use strong SMTP passwords
- Enable HTTPS in production
- Validate all user inputs
- Rate limit authentication endpoints
- Use environment variables for secrets

## Troubleshooting

**Database not created**
- Check write permissions in backend directory
- SQLite will auto-create `database.db` on first run

**Emails not sending**
- Verify SMTP credentials
- Check firewall rules for port 587
- Enable "Less secure app access" if using Gmail (or use App Password)

**Scheduler not triggering**
- Check server timezone vs user timezone
- Verify cron is running: look for "Reminder scheduler initialized" in logs
- Check `last_triggered` field to prevent duplicates

**CORS issues**
- Frontend must call `http://localhost:3000` (or deployed backend URL)
- CORS is configured to allow all origins in development

## License

MIT