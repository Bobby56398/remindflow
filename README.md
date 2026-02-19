# RemindMe - Smart Reminder SaaS Application

A full-stack web application that allows users to create accounts, log in, and manage recurring reminders for daily and weekly activities with email notifications.

## Features

### Authentication
- Email and password signup
- Secure login/logout
- Password hashing with bcrypt
- JWT-based session handling
- Token verification

### Dashboard
- Display all active reminders
- Show next upcoming reminder
- Create, edit, and delete reminders
- Toggle reminders active/inactive

### Reminder Settings
- **Title** - Name your reminder
- **Description** - Optional details
- **Time** - Set exact time (HH:MM)
- **Recurrence Type** - Daily or Weekly
- **Weekly Days** - Select specific days for weekly reminders
- **Active/Inactive Toggle** - Enable or disable reminders

### Backend Logic
- Cron scheduler checks every minute for due reminders
- Email notifications sent when reminder time is reached
- Timezone-aware reminder delivery
- Prevents duplicate notifications

## Tech Stack

### Frontend
- React 18 (via CDN)
- Tailwind CSS (via CDN)
- Vanilla JavaScript
- HTML5

### Backend
- Node.js (ESM modules)
- Express.js
- SQLite3 database
- JWT authentication
- bcryptjs for password hashing
- node-cron for scheduling
- nodemailer for email notifications

## Database Schema

### Users
- ID, name, email, password (hashed), timezone, created_at

### Reminders
- ID, user_id, title, description, reminder_time, recurrence_type, weekly_days, is_active, last_triggered, created_at, updated_at

### Reminder Logs
- ID, reminder_id, user_id, triggered_at, status

## Project Structure

```
/
├── index.html              # Frontend entry point
├── script.js               # React application code
├── README.md              # This file
├── .gitignore
└── backend/
    ├── package.json       # Backend dependencies
    ├── server.js          # Express server & scheduler
    ├── db.js              # SQLite database setup
    ├── .env.example       # Environment variables template
    ├── .gitignore
    ├── README.md          # Backend documentation
    ├── middleware/
    │   └── auth.js        # JWT authentication middleware
    ├── routes/
    │   ├── auth.js        # Authentication endpoints
    │   └── reminders.js   # Reminder CRUD endpoints
    └── services/
        ├── scheduler.js   # Cron job scheduler
        └── emailService.js # Email notification service
```

## Configuration

### Backend Environment Variables

Create `/backend/.env` file:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="RemindMe" <noreply@remindme.app>
```

### Email Setup (Gmail)

1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use generated password in `SMTP_PASS`

### Other SMTP Providers

- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **Outlook**: smtp-mail.outlook.com:587

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify JWT token

### Reminders

- `GET /api/reminders` - Get all user reminders
- `GET /api/reminders/:id` - Get specific reminder
- `POST /api/reminders` - Create new reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

All reminder endpoints require `Authorization: Bearer <token>` header.

## Deployment

### Backend Deployment

#### Heroku
```bash
cd backend
heroku create your-app-name
heroku config:set JWT_SECRET=your-secret
heroku config:set SMTP_USER=your-email
heroku config:set SMTP_PASS=your-password
git push heroku main
```

#### Railway
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically

#### AWS EC2
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone <your-repo>
cd backend
npm install

# Install PM2
npm install -g pm2

# Create .env file
nano .env

# Start application
pm2 start server.js --name remindme
pm2 save
pm2 startup
```

#### DigitalOcean App Platform
1. Connect GitHub repo
2. Configure environment variables
3. Set run command: `npm start`

### Frontend Deployment

#### Netlify
```bash
# Deploy frontend files
netlify deploy --prod --dir=.
```

#### Vercel
```bash
vercel --prod
```

#### GitHub Pages
```bash
# Push to gh-pages branch
git subtree push --prefix . origin gh-pages
```

**Important**: Update `API_URL` in `script.js` to your deployed backend URL:
```javascript
const API_URL = 'https://your-backend-url.herokuapp.com';
```

### Full-Stack Deployment

For simplicity, you can deploy both frontend and backend together:

1. Deploy backend to Heroku/Railway/AWS
2. Update `API_URL` in `script.js` to backend URL
3. Deploy frontend to Netlify/Vercel
4. Configure CORS in backend to allow frontend domain

## How It Works

### Scheduler Logic

1. Cron job runs every minute
2. Fetches all active reminders with user data
3. Converts current UTC time to user's timezone
4. Checks if current time matches reminder time
5. For weekly reminders, validates day of week matches
6. Prevents duplicates by checking `last_triggered` timestamp
7. Sends email notification via SMTP
8. Updates `last_triggered` and logs to database

### Timezone Handling

- User's timezone stored in database
- Scheduler converts UTC to user timezone
- Ensures reminders trigger at correct local time
- Supports all IANA timezone identifiers

### Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Protected API routes require valid token
- CORS configured for security
- SQL injection prevented with parameterized queries

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Setup

1. **Clone repository**
```bash
git clone <your-repo>
cd remindme
```

2. **Backend setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your SMTP credentials
npm run dev
```

3. **Frontend setup**
```bash
# Open index.html in browser
# Or use a local server:
npx serve .
```

4. **Access application**
- Frontend: http://localhost:8080
- Backend: http://localhost:3000

## Troubleshooting

### Database Issues
- SQLite auto-creates `database.db` on first run
- Check write permissions in `/backend` directory

### Email Not Sending
- Verify SMTP credentials in `.env`
- Check firewall allows port 587
- For Gmail, use App Password (not regular password)
- Check spam folder

### Scheduler Not Triggering
- Verify server timezone configuration
- Check `last_triggered` field to prevent duplicates
- Look for "Reminder scheduler initialized" in logs

### CORS Errors
- Update `API_URL` in `script.js`
- Verify backend CORS configuration allows frontend origin

### Authentication Issues
- Clear browser localStorage
- Check JWT_SECRET is set in backend
- Verify token format: `Bearer <token>`

## Future Enhancements

- SMS notifications (Twilio integration)
- Push notifications
- Calendar integration
- Reminder history view
- User profile settings
- Password reset flow
- Social authentication
- Mobile app (React Native)

## License

MIT

## Support

For issues and questions, please open a GitHub issue or contact support.