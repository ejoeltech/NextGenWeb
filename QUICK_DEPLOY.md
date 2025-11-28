# Quick Deploy Guide - Hostinger VPS

**Server IP**: 72.60.16.54  
**OS**: Ubuntu 24.04 LTS

## 🚀 Fast Deployment (Copy & Paste)

### Step 1: Connect to VPS
```bash
ssh root@72.60.16.54
# or
ssh your-username@72.60.16.54
```

### Step 2: Run These Commands

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx, PM2, Certbot
sudo apt install -y nginx git
sudo npm install -g pm2
sudo apt install -y certbot python3-certbot-nginx

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Clone NextGen website
cd /var/www
sudo git clone https://github.com/ejoeltech/nextgenweb.git
cd nextgenweb

# Install dependencies
sudo npm install --production

# Create directories
sudo mkdir -p backend/uploads frontend/assets
sudo chmod -R 755 backend/uploads frontend/assets

# Create .env file
sudo bash -c 'cat > .env << EOF
PORT=3000
JWT_SECRET='$(openssl rand -hex 32)'
NODE_ENV=production
EOF'

# Set permissions
sudo chown -R $USER:$USER /var/www/nextgenweb
```

### Step 3: Configure Nginx

**Replace `nextgen.yourdomain.com` with your actual subdomain!**

```bash
sudo nano /etc/nginx/sites-available/nextgen
```

Paste this (replace the domain):

```nginx
server {
    listen 80;
    server_name nextgen.yourdomain.com;

    access_log /var/log/nginx/nextgen-access.log;
    error_log /var/log/nginx/nextgen-error.log;
    client_max_body_size 50M;

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
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/nextgen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Start Application

```bash
cd /var/www/nextgenweb
pm2 start backend/server.js --name nextgen
pm2 save
pm2 startup
# Follow the command shown above
```

### Step 5: Configure DNS

In your domain DNS, add:
```
Type: A
Name: nextgen
Value: 72.60.16.54
TTL: 3600
```

Wait 5-30 minutes for DNS propagation.

### Step 6: Get SSL Certificate

After DNS propagates:
```bash
sudo certbot --nginx -d nextgen.yourdomain.com
```

### Step 7: Done! 🎉

- Website: `https://nextgen.yourdomain.com`
- Admin: `https://nextgen.yourdomain.com/admin`
- Login: `admin` / `admin123`

**⚠️ Change admin password immediately!**

---

## 📋 Useful Commands

```bash
# View logs
pm2 logs nextgen

# Restart app
pm2 restart nextgen

# Check status
pm2 status

# Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t
```

## 🔧 Adding More Services (N8N, Azuracast, etc.)

For each service, create a new Nginx config:

```bash
sudo nano /etc/nginx/sites-available/n8n
```

Use the same proxy template, just change:
- `server_name` (subdomain)
- `proxy_pass` (port)
- Log file names

Then:
```bash
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d n8n.yourdomain.com
```

---

**Full guide**: See `VPS_DEPLOYMENT_GUIDE.md` for detailed instructions.

