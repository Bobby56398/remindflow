# RemindMe - Testing Guide

## Manual Testing Steps

### 1. Initial Setup Test

**Expected Result**: Both servers start successfully

```bash
./start.sh
```

Verify:
- ✓ Backend running on http://localhost:3000
- ✓ Frontend running on http://localhost:8080
- ✓ Health check passes: `curl http://localhost:3000/health`

---

### 2. User Registration Test

**Steps**:
1. Open http://localhost:8080 in browser
2. Click "Sign up"
3. Fill in form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Timezone: (auto-filled)
4. Click "Sign Up"

**Expected Result**:
- ✓ Redirected to dashboard
- ✓ Welcome message shows "Welcome back, Test User"
- ✓ No error messages

**Troubleshooting**:
- If "Network error": Check backend with `curl http://localhost:3000/health`
- If CORS error: Ensure using http://localhost:8080 (not file://)
- Check browser console (F12) for errors

---

### 3. Login Test

**Steps**:
1. Logout if logged in
2. Click "Sign in"
3. Enter credentials from registration
4. Click "Sign In"

**Expected Result**:
- ✓ Successfully logged in
- ✓ Dashboard displays

---

### 4. Create Daily Reminder Test

**Steps**:
1. Click "+ New Reminder"
2. Fill in form:
   - Title: Morning Exercise
   - Description: 30 minutes cardio
   - Time: (2 minutes from now)
   - Recurrence: Daily
   - Active: Checked
3. Click "Save"

**Expected Result**:
- ✓ Reminder appears in "My Reminders" section
- ✓ Shows correct time and recurrence
- ✓ Badge shows "Active"

---

### 5. Create Weekly Reminder Test

**Steps**:
1. Click "+ New Reminder"
2. Fill in form:
   - Title: Team Meeting
   - Time: 10:00
   - Recurrence: Weekly
   - Select days: Monday, Wednesday, Friday
3. Click "Save"

**Expected Result**:
- ✓ Reminder created
- ✓ Shows selected days (Mon, Wed, Fri)

---

### 6. Edit Reminder Test

**Steps**:
1. Click "Edit" on any reminder
2. Change the title
3. Click "Save"

**Expected Result**:
- ✓ Changes saved
- ✓ New title displays

---

### 7. Toggle Active/Inactive Test

**Steps**:
1. Click "Active" button on a reminder
2. Should change to "Inactive"
3. Click again to reactivate

**Expected Result**:
- ✓ Status changes
- ✓ Inactive reminders show different styling

---

### 8. Delete Reminder Test

**Steps**:
1. Click "Delete" on a reminder
2. Confirm deletion

**Expected Result**:
- ✓ Confirmation dialog appears
- ✓ Reminder removed from list

---

### 9. Reminder Trigger Test

**Setup**: Create a reminder set for 1-2 minutes from now

**Wait**: Wait for the scheduled time

**Check Backend Logs**:
```bash
tail -f /tmp/backend.log
```

**Expected Result**:
- ✓ Log shows: "Triggering reminder: [Title] for user [email]"
- ✓ Log shows: "Reminder sent successfully"
- ✓ "Pending Completions" section appears on dashboard

---

### 10. Mark Complete Test

**Prerequisites**: Must have pending completion from step 9

**Steps**:
1. Find reminder in "Pending Completions"
2. Click "Mark Complete"

**Expected Result**:
- ✓ Removed from pending list
- ✓ Streak increases (check reminder card)
- ✓ Total streak number updates in stats

---

### 11. Streak Tracking Test

**Steps**:
1. Create daily reminder for current time + 1 minute
2. Wait for trigger
3. Mark as complete
4. Check reminder card

**Expected Result**:
- ✓ Badge shows "1 day streak"
- ✓ "Best: 1" appears in details

**Repeat**:
- Create another trigger tomorrow
- Complete it
- Streak should be 2

---

### 12. Missed Reminder Test

**Prerequisites**: Reminder triggered but not completed for 30+ minutes

**Expected Result** (after 30 minutes):
- ✓ Automatically marked as "missed"
- ✓ Streak resets to 0
- ✓ Email sent (check logs if SMTP not configured)
- ✓ Backend log shows "Marked as missed"

---

### 13. Analytics Dashboard Test

**Steps**:
1. Click "Analytics" in navigation
2. View overview cards
3. Scroll to weekly performance

**Expected Result**:
- ✓ Shows total completions, missed, completion rate
- ✓ Weekly chart displays
- ✓ Top streak highlighted (if any)

---

### 14. Dark Mode Test

**Steps**:
1. Click moon icon (🌙) in header
2. Check all pages

**Expected Result**:
- ✓ Theme changes to dark
- ✓ All components properly styled
- ✓ Setting persists on refresh

---

### 15. Mobile Responsive Test

**Steps**:
1. Open browser DevTools (F12)
2. Toggle device toolbar
3. Select mobile device (e.g., iPhone 12)
4. Navigate through app

**Expected Result**:
- ✓ Layout adapts to mobile
- ✓ Buttons are touch-friendly
- ✓ Text is readable
- ✓ Navigation works

---

### 16. Browser Notifications Test

**Steps**:
1. Click bell icon (🔕) in header
2. Allow notifications when prompted
3. Icon changes to 🔔

**Expected Result**:
- ✓ Browser requests permission
- ✓ Icon shows enabled state
- ✓ No console errors

**Note**: Actual push notifications require VAPID keys configuration

---

### 17. AI Suggestions Test

**Prerequisites**: Have completed at least 5 reminders

**API Test**:
```bash
curl http://localhost:3000/api/suggestions/optimal-times \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- ✓ Returns suggested times
- ✓ Based on completion history
- ✓ Includes confidence level

---

### 18. Smart Rescheduling Test

**Prerequisites**: Missed same reminder 3+ times

**API Test**:
```bash
curl -X POST http://localhost:3000/api/suggestions/reschedule/REMINDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**:
- ✓ Suggests new time
- ✓ Explains reason
- ✓ Shows completion rate

---

### 19. Weekly Report Test

**Trigger**: Runs Monday at 9 AM (or manually trigger)

**Expected Result**:
- ✓ Email sent with stats
- ✓ Shows total/completed/missed
- ✓ Includes top streaks
- ✓ Personalized message

---

### 20. Performance Test

**Steps**:
1. Create 50 reminders
2. Navigate through app
3. Check load times

**Expected Result**:
- ✓ Pages load quickly (< 500ms)
- ✓ No lag when scrolling
- ✓ API responses fast

---

## API Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### Create User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User",
    "email": "api@test.com",
    "password": "test1234",
    "timezone": "UTC"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@test.com",
    "password": "test1234"
  }'
```

Save the token from response.

### Get Reminders
```bash
curl http://localhost:3000/api/reminders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Reminder
```bash
curl -X POST http://localhost:3000/api/reminders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Reminder",
    "reminder_time": "15:00",
    "recurrence_type": "daily",
    "is_active": true
  }'
```

### Get Analytics
```bash
curl http://localhost:3000/api/analytics/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Streaks
```bash
curl http://localhost:3000/api/completions/streaks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Test Scenarios

### Scenario 1: New User Journey
1. Sign up
2. Create 3 reminders (daily, weekly, mixed)
3. Wait for one to trigger
4. Complete it
5. Check analytics
6. Enable dark mode
7. View on mobile

### Scenario 2: Power User
1. Create 10+ reminders
2. Build 7-day streak
3. Miss one intentionally
4. Check analytics graphs
5. Get AI suggestions
6. Apply smart rescheduling

### Scenario 3: Recovery
1. Miss 3 reminders
2. Receive missed emails
3. Complete next ones
4. Rebuild streak
5. Check weekly report

---

## Automated Testing (Future)

### Backend Tests
```bash
cd backend
npm test
```

### Integration Tests
- Test all API endpoints
- Test database operations
- Test scheduler logic
- Test email sending

### Frontend Tests
- Component rendering
- User interactions
- API integration
- Responsive design

---

## Performance Benchmarks

**Target Metrics**:
- API response time: < 100ms
- Page load time: < 2s
- Time to interactive: < 3s
- Lighthouse score: > 90

**Test Tools**:
- Chrome DevTools Performance
- Lighthouse audit
- Apache Bench for API load testing

---

## Security Testing

1. **SQL Injection**: Try SQL in input fields
2. **XSS**: Try `<script>alert('xss')</script>`
3. **CSRF**: Test without proper tokens
4. **Rate Limiting**: Send 100+ requests quickly
5. **Authentication**: Try accessing API without token

**Expected**: All attacks should fail safely

---

## Bug Reporting

If you find bugs:
1. Note exact steps to reproduce
2. Check browser console for errors
3. Check backend logs
4. Include environment (browser, OS)
5. Report with screenshots if possible