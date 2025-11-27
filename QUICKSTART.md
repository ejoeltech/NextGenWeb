# Quick Start Guide

## Installation (5 minutes)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your logo**
   - Place your logo file at: `frontend/assets/logo.png`
   - Supported: PNG, JPG, SVG

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the website**
   - Website: http://localhost:3000
   - Admin: http://localhost:3000/admin
   - Login: `admin` / `admin123`

## First Steps

1. **Change admin password** (important!)
   - Currently, you need to manually update the database or add a password change feature

2. **Customize content**
   - Go to Admin Panel → Content Management
   - Edit hero tagline, mission, about section
   - Upload images and banners

3. **Test registration**
   - Fill out the registration form on the homepage
   - Check Admin Panel → Members to see the entry

## Deployment Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET in .env
- [ ] Add your logo to frontend/assets/logo.png
- [ ] Configure domain in nginx.conf
- [ ] Set up SSL certificate
- [ ] Test all features
- [ ] Backup database regularly

## Common Commands

```bash
# Development
npm start              # Start server
npm run dev            # Start with nodemon (if installed)

# Production (with PM2)
pm2 start backend/server.js --name nextgen
pm2 save
pm2 logs nextgen

# Docker
docker-compose up -d   # Start with Docker
docker-compose logs    # View logs
```

## Need Help?

Check the main README.md for detailed documentation.

