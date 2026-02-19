# RemindMe - Deployment Guide

## Full-Stack Production Deployment

### Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Configure .env with production values
npm start

# Frontend
# Serve index.html with any static server
# Update API_URL in script.js to your backend URL
```

### Backend Deployment

#### Environment Variables

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="RemindMe" <noreply@remindme.app>
```

#### Platform-Specific Guides

**Heroku**
```bash
heroku create remindme-app
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-app-password
git subtree push --prefix backend heroku main
```

**Railway**
1. Connect GitHub repository
2. Select `/backend` as root directory
3. Add environment variables in dashboard
4. Deploy automatically on push

**DigitalOcean App Platform**
1. Create new app from GitHub
2. Set root directory to `/backend`
3. Run command: `npm start`
4. Add environment variables
5. Enable HTTPS

**AWS EC2**
```bash
# SSH into instance
ssh -i key.pem ubuntu@your-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone https://github.com/yourusername/remindme.git
cd remindme/backend
npm install

# Setup environment
nano .env
# Paste your environment variables

# Install PM2
sudo npm install -g pm2

# Start application
pm2 start server.js --name remindme
pm2 save
pm2 startup

# Setup nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/remindme

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

sudo ln -s /etc/nginx/sites-available/remindme /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Frontend Deployment

#### Update API URL

Edit `script.js`:
```javascript
const API_URL = 'https://your-backend-url.com';
```

#### Netlify

```bash
# netlify.toml
[build]
  publish = "."
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Deploy:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Vercel

```bash
npm install -g vercel
vercel --prod
```

#### GitHub Pages

```bash
# Update API_URL in script.js first
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main

# In GitHub repository settings:
# Pages > Source > Deploy from branch > main
```

#### Cloudflare Pages

1. Connect GitHub repository
2. Build command: (none)
3. Output directory: `/`
4. Deploy

### Performance Optimizations

#### Backend

- **Compression**: Enabled via `compression` middleware
- **Rate Limiting**: 100 requests per minute per IP
- **Caching**: 5-minute cache for GET requests
- **Database Indexes**: Added on user_id, reminder_id, status fields
- **Connection Pooling**: SQLite WAL mode for concurrent reads

#### Frontend

- **Service Worker**: Caches assets for offline support
- **Code Splitting**: React components loaded on demand
- **Dark Mode**: System preference detection
- **Mobile First**: Responsive design with Tailwind
- **PWA**: Installable on mobile devices

### Database Backup

```bash
# Backup SQLite database
cp backend/database.db backend/database.backup.$(date +%Y%m%d).db

# Automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
cp backend/database.db $BACKUP_DIR/database_$DATE.db
find $BACKUP_DIR -name "database_*.db" -mtime +30 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh
```

### Monitoring

#### PM2 Monitoring

```bash
pm2 monit
pm2 logs remindme
pm2 restart remindme
```

#### Health Checks

```bash
curl https://your-backend-url.com/health
```

### Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Use HTTPS for both frontend and backend
- [ ] Configure CORS to allow only your frontend domain
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Keep dependencies updated
- [ ] Set secure headers (helmet.js)
- [ ] Validate all user inputs
- [ ] Use parameterized SQL queries (already implemented)

### Scaling Considerations

#### Horizontal Scaling

- Use PostgreSQL or MySQL instead of SQLite
- Add Redis for caching and session storage
- Deploy multiple backend instances behind load balancer
- Use dedicated email service (SendGrid, AWS SES)

#### Database Migration (SQLite to PostgreSQL)

```bash
# Export SQLite data
sqlite3 database.db .dump > dump.sql

# Import to PostgreSQL
psql -U postgres -d remindme < dump.sql

# Update connection string in db.js
```

### Troubleshooting

**Issue: Emails not sending**
- Check SMTP credentials
- Enable "Less secure app access" or use App Password for Gmail
- Check spam folder
- Verify port 587 is not blocked

**Issue: Database locked**
- Enable WAL mode: `PRAGMA journal_mode=WAL;`
- Reduce concurrent write operations
- Consider migrating to PostgreSQL

**Issue: High memory usage**
- Clear cache periodically
- Limit result set sizes
- Use pagination for large queries

**Issue: Push notifications not working**
- Generate VAPID keys
- Configure service worker properly
- Check browser notification permissions

### Cost Estimates

**Minimal Setup (< $10/month)**
- Backend: Railway/Render free tier
- Frontend: Netlify/Vercel free tier
- Email: Gmail (free for low volume)

**Production Setup ($20-50/month)**
- Backend: DigitalOcean Droplet ($6)
- Frontend: Cloudflare Pages (free)
- Email: SendGrid ($15)
- Database: Managed PostgreSQL ($15)
- Monitoring: UptimeRobot (free)

### Support

For deployment issues:
1. Check server logs: `pm2 logs`
2. Verify environment variables
3. Test API endpoints: `curl https://your-api.com/health`
4. Check database permissions
5. Review nginx/reverse proxy config