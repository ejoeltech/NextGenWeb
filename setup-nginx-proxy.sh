#!/bin/bash

# Nginx Reverse Proxy Setup for Multiple Services
# For Ubuntu 24.04 LTS with NextGen, Azuracast, N8N, etc.

set -e

echo "========================================="
echo "Nginx Reverse Proxy Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo -e "${GREEN}Installing Nginx...${NC}"
    apt update
    apt install nginx -y
fi

# Install Certbot
if ! command -v certbot &> /dev/null; then
    echo -e "${GREEN}Installing Certbot...${NC}"
    apt install certbot python3-certbot-nginx -y
fi

# Create Nginx configuration directory structure
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Backup default config
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo -e "${YELLOW}Backing up default Nginx config...${NC}"
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
fi

# Create NextGen configuration template
cat > /etc/nginx/sites-available/nextgen-template << 'EOF'
server {
    listen 80;
    server_name SUBDOMAIN.DOMAIN.COM;

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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Create N8N configuration template
cat > /etc/nginx/sites-available/n8n-template << 'EOF'
server {
    listen 80;
    server_name SUBDOMAIN.DOMAIN.COM;

    access_log /var/log/nginx/n8n-access.log;
    error_log /var/log/nginx/n8n-error.log;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Create Azuracast configuration template
cat > /etc/nginx/sites-available/azuracast-template << 'EOF'
server {
    listen 80;
    server_name SUBDOMAIN.DOMAIN.COM;

    access_log /var/log/nginx/azuracast-access.log;
    error_log /var/log/nginx/azuracast-error.log;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable Gzip compression globally
if ! grep -q "gzip on" /etc/nginx/nginx.conf; then
    echo -e "${GREEN}Enabling Gzip compression...${NC}"
    sed -i '/http {/a\    gzip on;\n    gzip_vary on;\n    gzip_proxied any;\n    gzip_comp_level 6;\n    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;' /etc/nginx/nginx.conf
fi

# Test Nginx configuration
echo -e "${GREEN}Testing Nginx configuration...${NC}"
nginx -t

echo ""
echo -e "${GREEN}========================================="
echo "Nginx Reverse Proxy Setup Complete!"
echo "=========================================${NC}"
echo ""
echo "Templates created in /etc/nginx/sites-available/:"
echo "  - nextgen-template"
echo "  - n8n-template"
echo "  - azuracast-template"
echo ""
echo "To create a new site:"
echo "  1. Copy template: cp /etc/nginx/sites-available/nextgen-template /etc/nginx/sites-available/nextgen"
echo "  2. Edit and replace SUBDOMAIN.DOMAIN.COM"
echo "  3. Enable: ln -s /etc/nginx/sites-available/nextgen /etc/nginx/sites-enabled/"
echo "  4. Test: nginx -t"
echo "  5. Reload: systemctl reload nginx"
echo "  6. Get SSL: certbot --nginx -d nextgen.yourdomain.com"
echo ""

