#!/bin/bash

echo "========================================="
echo "NextGen Community Website Installation"
echo "========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Install dependencies
echo "Installing dependencies..."
npm install

# Create necessary directories
echo "Creating directories..."
mkdir -p backend/uploads
mkdir -p frontend/assets

# Set permissions
chmod -R 755 backend/uploads
chmod -R 755 frontend/assets

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
PORT=3000
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
EOF
    echo ".env file created with random JWT_SECRET"
else
    echo ".env file already exists"
fi

# Initialize database (will be created on first run)
echo "Database will be initialized on first server start"

# Install PM2 for process management (optional)
if command -v pm2 &> /dev/null; then
    echo "PM2 is already installed"
else
    echo "Installing PM2 for process management..."
    sudo npm install -g pm2
fi

echo "========================================="
echo "Installation complete!"
echo "========================================="
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "Or with PM2:"
echo "  pm2 start backend/server.js --name nextgen"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo "  (Please change this after first login!)"
echo ""

