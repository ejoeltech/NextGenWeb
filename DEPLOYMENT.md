# Deployment Guide for Hostinger VPS

## Prerequisites

- Ubuntu VPS (Hostinger)
- SSH access
- Domain name (optional but recommended)

## Step-by-Step Deployment

### 1. Connect to Your VPS

```bash
ssh root@your-server-ip
# or
ssh username@your-server-ip
```

### 2. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # Verify installation (should show v18.x)
```

### 4. Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Upload Project Files

**Option A: Using SCP (from your local machine)**
```bash
scp -r nextgenweb root@your-server-ip:/var/www/
```

**Option B: Using Git**
```bash
cd /var/www
git clone your-repo-url nextgenweb
cd nextgenweb
```

**Option C: Using SFTP/FTP Client**
- Connect via FileZilla or similar
- Upload entire `nextgenweb` folder to `/var/www/`

### 6. Install Dependencies

```bash
cd /var/www/nextgenweb
chmod +x install.sh
./install.sh
```

Or manually:
```bash
npm install
mkdir -p backend/uploads frontend/assets
```

### 7. Configure Environment

```bash
nano .env
```

Add:
```
PORT=3000
JWT_SECRET=your-very-secure-random-secret-key-here
NODE_ENV=production
```

Generate a secure secret:
```bash
openssl rand -hex 32
```

### 8. Add Your Logo

```bash
# Upload your logo file
# Place it at: /var/www/nextgenweb/frontend/assets/logo.png
```

### 9. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/nextgen
```

Paste the content from `nginx.conf` and update:
- `server_name` with your domain
- Adjust paths if needed

```bash
sudo ln -s /etc/nginx/sites-available/nextgen /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### 10. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 11. Start the Application

```bash
cd /var/www/nextgenweb
pm2 start backend/server.js --name nextgen
pm2 save
pm2 startup  # Follow the instructions shown
```

### 12. Set Up SSL (HTTPS) - Recommended

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically configure Nginx for HTTPS.

### 13. Configure Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 14. Verify Everything Works

- Visit `http://your-domain.com` (or `http://your-server-ip`)
- Visit `http://your-domain.com/admin`
- Login with: `admin` / `admin123`
- **IMPORTANT**: Change the password immediately!

## Maintenance Commands

```bash
# View logs
pm2 logs nextgen

# Restart application
pm2 restart nextgen

# Stop application
pm2 stop nextgen

# View status
pm2 status

# Update application
cd /var/www/nextgenweb
git pull  # if using git
npm install
pm2 restart nextgen
```

## Backup Database

```bash
# Create backup
cp /var/www/nextgenweb/backend/nextgen.db /var/www/nextgenweb/backend/nextgen.db.backup

# Automated backup script (add to crontab)
# 0 2 * * * cp /var/www/nextgenweb/backend/nextgen.db /var/www/backups/nextgen-$(date +\%Y\%m\%d).db
```

## Troubleshooting

### Application won't start
```bash
pm2 logs nextgen  # Check logs
cd /var/www/nextgenweb
node backend/server.js  # Run directly to see errors
```

### Nginx 502 Bad Gateway
- Check if Node.js app is running: `pm2 status`
- Check if port 3000 is correct
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Permission errors
```bash
sudo chown -R $USER:$USER /var/www/nextgenweb
chmod -R 755 /var/www/nextgenweb
chmod -R 775 /var/www/nextgenweb/backend/uploads
```

### Port already in use
```bash
sudo lsof -i :3000
# Kill the process or change PORT in .env
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong JWT_SECRET
- [ ] Enabled HTTPS/SSL
- [ ] Configured firewall
- [ ] Set up regular backups
- [ ] Updated all dependencies: `npm audit fix`
- [ ] Restricted file permissions

## Performance Optimization

1. **Enable Gzip in Nginx** (add to nginx config):
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

2. **Use PM2 Cluster Mode** (for multiple CPU cores):
```bash
pm2 delete nextgen
pm2 start backend/server.js -i max --name nextgen
```

3. **Set up monitoring**:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
```

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs nextgen`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify Node.js version: `node -v`
4. Check disk space: `df -h`
5. Check memory: `free -h`

