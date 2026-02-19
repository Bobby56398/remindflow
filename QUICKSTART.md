# RemindMe - Quick Start Guide

## Local Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Python 3 (for frontend server)

### 1. Start the Application

**Option A: Use the startup script**
```bash
chmod +x start.sh
./start.sh
```

**Option B: Manual startup**

Terminal 1 (Backend):
```bash
cd backend
npm install
node server.js
```

Terminal 2 (Frontend):
```bash
python3 -m http.server 8080
```

### 2. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 3. Create Your First Account

1. Open http://localhost:8080 in your browser
2. Click "Sign up"
3. Enter your details:
   - Name: Your name
   - Email: Any valid email format
   - Password: At least 6 characters
   - Timezone: Auto-detected (you can change it)
4. Click "Sign Up"

### Troubleshooting

#### "Network error please try again"

**Cause**: Frontend cannot connect to backend

**Solutions**:

1. **Check if backend is running**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"ok","message":"RemindMe API is running"}`

2. **Check browser console** (F12 in Chrome/Firefox)
   - Look for CORS errors
   - Check the Network tab for failed requests

3. **Verify ports are not in use**
   ```bash
   lsof -i :3000  # Backend port
   lsof -i :8080  # Frontend port
   ```

4. **Restart both servers**
   ```bash
   ./start.sh
   ```

5. **Check backend logs**
   ```bash
   tail -f /tmp/backend.log
   ```

#### CORS Issues

If you see CORS errors in the browser console:

1. Make sure backend is running on port 3000
2. Access frontend via http://localhost:8080 (not file://)
3. Clear browser cache and cookies
4. Try a different browser

#### Port Already in Use

```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Kill processes on port 8080
lsof -ti:8080 | xargs kill -9

# Restart
./start.sh
```

#### Database Errors

```bash
# Reset database
rm backend/database.db

# Restart backend
cd backend
node server.js
```

### Testing the API Directly

**Create Account**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "timezone": "UTC"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Create Reminder** (requires token from login):
```bash
curl -X POST http://localhost:3000/api/reminders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Morning Exercise",
    "description": "30 min workout",
    "reminder_time": "07:00",
    "recurrence_type": "daily",
    "is_active": true
  }'
```

### Features to Try

1. **Create Reminders**
   - Daily reminders (every day at a specific time)
   - Weekly reminders (specific days of the week)

2. **Track Progress**
   - Mark reminders as completed
   - Build streaks
   - View analytics

3. **Smart Features**
   - Get AI-based time suggestions
   - Smart rescheduling for missed tasks
   - Productivity insights

4. **UI Features**
   - Toggle dark mode (moon icon)
   - Enable browser notifications (bell icon)
   - Mobile responsive design

### Environment Variables (Optional)

Create `backend/.env` for email notifications:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Default Credentials for Testing

No default credentials. You must create an account.

**Test Data**:
- Email: Use any format (e.g., test@test.com)
- Password: Minimum 6 characters
- Emails won't actually be sent unless you configure SMTP

### Stopping the Application

```bash
# Find and kill processes
pkill -f "node.*server.js"
pkill -f "python.*http.server"

# Or use process IDs from start.sh output
kill <BACKEND_PID>
kill <FRONTEND_PID>
```

### Development Tips

1. **Auto-reload backend on changes**:
   ```bash
   cd backend
   npm run dev
   ```

2. **View real-time logs**:
   ```bash
   tail -f /tmp/backend.log
   ```

3. **Test email notifications** (without SMTP):
   - Emails are logged to console in development
   - Check backend logs for email content

4. **Database location**:
   - SQLite file: `backend/database.db`
   - View with: `sqlite3 backend/database.db`

### Common Issues

| Issue | Solution |
|-------|----------|
| Signup fails | Check backend is running on port 3000 |
| No email received | Configure SMTP in .env or check logs |
| Dark mode not working | Clear browser localStorage |
| Notifications blocked | Check browser notification permissions |
| Streaks not updating | Complete a reminder via "Mark Complete" button |

### Next Steps

1. Create a few reminders
2. Wait for them to trigger (or set time to 1 minute from now)
3. Check pending completions
4. Mark them complete to build streaks
5. View analytics dashboard
6. Try AI suggestions for optimal times

### Support

If you encounter issues:

1. Check backend logs: `tail -f /tmp/backend.log`
2. Check browser console (F12)
3. Verify both servers are running
4. Try restarting: `./start.sh`
5. Reset database: `rm backend/database.db`

### Production Deployment

See DEPLOYMENT.md for production setup instructions.