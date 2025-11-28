# VPS Deployment Guide - Hostinger Ubuntu 24.04 LTS

Complete step-by-step guide for deploying NextGen Community website on your Hostinger VPS with Nginx reverse proxy for multiple services.

## Server Information
- **VPS IP**: 72.60.16.54
- **OS**: Ubuntu 24.04 LTS
- **Services**: NextGen Website, Azuracast, N8N, and others
- **Reverse Proxy**: Nginx with subdomain support

## Prerequisites

1. **Domain name** (e.g., `yourdomain.com`)
2. **SSH access** to your VPS
3. **DNS access** to create subdomain records

## Step 1: Connect to Your VPS

```bash
ssh root@72.60.16.54
# or
ssh your-username@72.60.16.54
```

## Step 2: Initial Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Essential Tools
```bash
sudo apt install -y curl wget git ufw
```

### Configure Firewall
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Step 3: Install Node.js

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v  # Should show v20.x.x
npm -v
```

## Step 4: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

## Step 5: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 6: Install Certbot (for SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

## Step 7: Deploy NextGen Website

### Option A: Clone from GitHub (Recommended)

```bash
cd /var/www
sudo git clone https://github.com/ejoeltech/nextgenweb.git
sudo mv nextgenweb nextgenweb-temp
sudo mkdir -p nextgenweb
sudo mv nextgenweb-temp/* nextgenweb/
sudo rm -rf nextgenweb-temp
```

### Option B: Upload via SCP (from your local machine)

```bash
# From your local machine
scp -r nextgenweb root@72.60.16.54:/var/www/
```

### Option C: Use the deployment script

```bash
# Upload deploy-vps.sh to your server
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh nextgen.yourdomain.com
```

## Step 8: Install Dependencies

```bash
cd /var/www/nextgenweb
sudo npm install --production
```

## Step 9: Configure Environment

```bash
cd /var/www/nextgenweb
sudo nano .env
```

Add the following (generate a secure JWT_SECRET):

```env
PORT=3000
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
```

Generate JWT_SECRET:
```bash
openssl rand -hex 32
```

## Step 10: Create Required Directories

```bash
cd /var/www/nextgenweb
sudo mkdir -p backend/uploads frontend/assets
sudo chmod -R 755 backend/uploads frontend/assets
```

## Step 11: Configure Nginx for NextGen

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/nextgen
```

Paste this configuration (replace `nextgen.yourdomain.com` with your subdomain):

```nginx
server {
    listen 80;
    server_name nextgen.yourdomain.com;

    # Logging
    access_log /var/log/nginx/nextgen-access.log;
    error_log /var/log/nginx/nextgen-error.log;

    # Increase upload size
    client_max_body_size 50M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/nextgen /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 12: Configure DNS

In your domain's DNS settings, add an A record:

```
Type: A
Name: nextgen (or @ for root domain)
Value: 72.60.16.54
TTL: 3600
```

Wait for DNS propagation (5-30 minutes). Check with:
```bash
dig nextgen.yourdomain.com
# or
nslookup nextgen.yourdomain.com
```

## Step 13: Start the Application

```bash
cd /var/www/nextgenweb
pm2 start backend/server.js --name nextgen
pm2 save
pm2 startup
```

Follow the command shown by `pm2 startup` to enable auto-start on boot.

## Step 14: Set Up SSL (HTTPS)

After DNS has propagated:

```bash
sudo certbot --nginx -d nextgen.yourdomain.com
```

Certbot will:
- Obtain SSL certificate
- Automatically configure Nginx for HTTPS
- Set up auto-renewal

## Step 15: Verify Everything Works

1. **Check application status:**
   ```bash
   pm2 status
   pm2 logs nextgen
   ```

2. **Check Nginx status:**
   ```bash
   sudo systemctl status nginx
   ```

3. **Test website:**
   - Visit: `https://nextgen.yourdomain.com`
   - Admin: `https://nextgen.yourdomain.com/admin`
   - Login: `admin` / `admin123`

## Managing Multiple Services with Nginx

Since you're running Azuracast, N8N, and other services, here's how to organize:

### Directory Structure
```
/etc/nginx/sites-available/
├── nextgen          # NextGen website (port 3000)
├── azuracast        # Azuracast (port 8000)
├── n8n              # N8N (port 5678)
└── default          # Default/fallback
```

### Example: N8N Configuration

```bash
sudo nano /etc/nginx/sites-available/n8n
```

```nginx
server {
    listen 80;
    server_name n8n.yourdomain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d n8n.yourdomain.com
```

### Example: Azuracast Configuration

Azuracast typically runs on port 8000. Configure similarly:

```nginx
server {
    listen 80;
    server_name radio.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Useful Commands

### Application Management
```bash
pm2 logs nextgen          # View logs
pm2 restart nextgen       # Restart app
pm2 stop nextgen         # Stop app
pm2 delete nextgen        # Remove from PM2
pm2 status               # Check all apps
pm2 monit                # Monitor dashboard
```

### Nginx Management
```bash
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx      # Reload config
sudo systemctl restart nginx     # Restart Nginx
sudo systemctl status nginx      # Check status
sudo tail -f /var/log/nginx/error.log  # View error log
```

### SSL Certificate Management
```bash
sudo certbot certificates        # List certificates
sudo certbot renew               # Renew certificates
sudo certbot renew --dry-run     # Test renewal
```

### Database Backup
```bash
# Backup database
cp /var/www/nextgenweb/backend/nextgen.db /var/www/backups/nextgen-$(date +%Y%m%d).db

# Automated backup (add to crontab)
crontab -e
# Add: 0 2 * * * cp /var/www/nextgenweb/backend/nextgen.db /var/www/backups/nextgen-$(date +\%Y\%m\%d).db
```

## Troubleshooting

### Application won't start
```bash
cd /var/www/nextgenweb
node backend/server.js  # Run directly to see errors
pm2 logs nextgen        # Check PM2 logs
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check if port is correct
netstat -tulpn | grep 3000

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Port conflicts
```bash
# Check what's using a port
sudo lsof -i :3000

# Change port in .env if needed
nano /var/www/nextgenweb/.env
```

### Permission errors
```bash
sudo chown -R $USER:$USER /var/www/nextgenweb
chmod -R 755 /var/www/nextgenweb
chmod -R 775 /var/www/nextgenweb/backend/uploads
```

### SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL config
sudo nginx -t
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong JWT_SECRET in .env
- [ ] Enabled firewall (UFW)
- [ ] Set up SSL certificates
- [ ] Disabled root SSH login (optional but recommended)
- [ ] Set up regular backups
- [ ] Updated all dependencies: `npm audit fix`
- [ ] Restricted file permissions

## Maintenance

### Update Application
```bash
cd /var/www/nextgenweb
git pull origin main
npm install
pm2 restart nextgen
```

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Monitor Resources
```bash
htop                    # CPU/Memory usage
df -h                   # Disk space
pm2 monit               # Application monitoring
```

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs nextgen`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify Node.js version: `node -v`
4. Check disk space: `df -h`
5. Check memory: `free -h`

## Next Steps

1. **Add your logo**: Upload to `/var/www/nextgenweb/frontend/assets/logo.png`
2. **Customize content**: Use admin panel to edit text
3. **Change admin password**: Update in database or add password change feature
4. **Set up backups**: Automate database backups
5. **Monitor**: Set up monitoring for uptime and performance

---

**Your NextGen website should now be live at: https://nextgen.yourdomain.com**

