#!/bin/bash

# NextGen Community Website - VPS Deployment Script
# For Ubuntu 24.04 LTS on Hostinger VPS
# Compatible with Azuracast, N8N, and other services

set -e

echo "========================================="
echo "NextGen Community - VPS Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${1:-nextgen.yourdomain.com}"  # Change this to your domain
APP_DIR="/var/www/nextgenweb"
SERVICE_USER="www-data"

echo -e "${YELLOW}Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "App Directory: $APP_DIR"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Update system
echo -e "${GREEN}[1/10] Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js 20.x (LTS)
echo -e "${GREEN}[2/10] Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Install Nginx
echo -e "${GREEN}[3/10] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
fi
systemctl enable nginx
systemctl start nginx

# Install PM2
echo -e "${GREEN}[4/10] Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Install Certbot for SSL
echo -e "${GREEN}[5/10] Installing Certbot...${NC}"
apt install certbot python3-certbot-nginx -y

# Create application directory
echo -e "${GREEN}[6/10] Setting up application directory...${NC}"
mkdir -p $APP_DIR
chown -R $USER:$USER $APP_DIR

# Note: User needs to upload files or clone from GitHub
echo -e "${YELLOW}Note: You need to upload your project files to $APP_DIR${NC}"
echo "You can:"
echo "  1. Clone from GitHub: cd $APP_DIR && git clone https://github.com/ejoeltech/nextgenweb.git ."
echo "  2. Or upload files via SFTP/SCP"
echo ""
read -p "Press Enter after you've uploaded/cloned the files..."

# Install dependencies
echo -e "${GREEN}[7/10] Installing Node.js dependencies...${NC}"
cd $APP_DIR
npm install --production

# Create necessary directories
mkdir -p backend/uploads frontend/assets
chmod -R 755 backend/uploads frontend/assets

# Create .env file
if [ ! -f .env ]; then
    echo -e "${GREEN}[8/10] Creating .env file...${NC}"
    JWT_SECRET=$(openssl rand -hex 32)
    cat > .env << EOF
PORT=3000
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
EOF
    echo "Created .env with secure JWT_SECRET"
else
    echo ".env file already exists"
fi

# Configure Nginx
echo -e "${GREEN}[9/10] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/nextgen << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Logging
    access_log /var/log/nginx/nextgen-access.log;
    error_log /var/log/nginx/nextgen-error.log;

    # Increase upload size
    client_max_body_size 50M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
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
EOF

# Enable site
ln -sf /etc/nginx/sites-available/nextgen /etc/nginx/sites-enabled/
nginx -t

# Start application with PM2
echo -e "${GREEN}[10/10] Starting application...${NC}"
cd $APP_DIR
pm2 start backend/server.js --name nextgen
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u $USER --hp /home/$USER
echo -e "${YELLOW}Follow the command shown above to enable PM2 on boot${NC}"

# Reload Nginx
systemctl reload nginx

echo ""
echo -e "${GREEN}========================================="
echo "Deployment Complete!"
echo "=========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure DNS:"
echo "   Add A record: $DOMAIN -> 72.60.16.54"
echo ""
echo "2. Set up SSL (after DNS propagates):"
echo "   certbot --nginx -d $DOMAIN"
echo ""
echo "3. Access your site:"
echo "   http://$DOMAIN"
echo "   Admin: http://$DOMAIN/admin"
echo "   Default login: admin / admin123"
echo ""
echo "4. Useful commands:"
echo "   pm2 logs nextgen          # View logs"
echo "   pm2 restart nextgen       # Restart app"
echo "   pm2 status                # Check status"
echo "   systemctl status nginx    # Check Nginx"
echo ""
echo -e "${RED}IMPORTANT: Change admin password after first login!${NC}"
echo ""

