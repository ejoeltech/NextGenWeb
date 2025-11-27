# NextGen Community Website

A responsive, glassmorphic single-page website for the NextGen Community with a comprehensive admin panel for content and member management.

## Features

### Public Website
- **Hero Section**: Logo, tagline, and mission statement
- **About Section**: Information about the NextGen Community
- **Empowerment Programs**: 6 program cards with hover effects
- **Awareness Programs**: 9 awareness campaign cards
- **Member Registration**: Full registration form with validation
- **Responsive Design**: Works on all devices
- **Glassmorphic UI**: Modern frosted glass design with neon accents

### Admin Panel
- **Authentication**: Secure login system
- **Content Management**: Edit text, images, and banners
- **Member Management**: View all registered members
- **CSV Export**: Export member data to CSV
- **Media Library**: Upload and manage images/videos

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Authentication**: JWT
- **File Upload**: Multer

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- (Optional) PM2 for process management

### Quick Start

1. **Clone or extract the project**
   ```bash
   cd nextgenweb
   ```

2. **Run installation script**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

   Or manually:
   ```bash
   npm install
   mkdir -p backend/uploads frontend/assets
   ```

3. **Configure environment** (optional)
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Add your logo**
   - Place your logo file as `frontend/assets/logo.png`
   - Supported formats: PNG, JPG, SVG

5. **Start the server**
   ```bash
   npm start
   ```

   The website will be available at `http://localhost:3000`
   Admin panel: `http://localhost:3000/admin`

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change the default password after first login!

## Project Structure

```
nextgenweb/
├── frontend/           # Public website files
│   ├── index.html      # Main page
│   ├── styles.css      # Styles with glassmorphism
│   ├── script.js       # Frontend JavaScript
│   └── assets/         # Images, logos (add your logo here)
├── admin/              # Admin panel files
│   ├── index.html      # Admin dashboard
│   ├── styles.css      # Admin styles
│   └── script.js       # Admin JavaScript
├── backend/            # Server files
│   ├── server.js       # Express server
│   ├── database.js     # Database setup
│   ├── routes/         # API routes
│   │   ├── auth.js     # Authentication
│   │   ├── content.js  # Content management
│   │   ├── members.js  # Member management
│   │   └── upload.js   # File uploads
│   └── uploads/        # Uploaded files
├── package.json        # Dependencies
├── Dockerfile          # Docker configuration
├── nginx.conf          # Nginx reverse proxy config
└── install.sh          # Installation script
```

## Deployment on Ubuntu VPS (Hostinger)

### Option 1: Direct Deployment

1. **SSH into your VPS**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js** (if not installed)
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Upload project files**
   ```bash
   # Use SCP, SFTP, or Git to upload files
   scp -r nextgenweb user@your-server:/var/www/
   ```

4. **Install dependencies**
   ```bash
   cd /var/www/nextgenweb
   chmod +x install.sh
   ./install.sh
   ```

5. **Install and configure Nginx**
   ```bash
   sudo apt-get install nginx
   sudo cp nginx.conf /etc/nginx/sites-available/nextgen
   sudo ln -s /etc/nginx/sites-available/nextgen /etc/nginx/sites-enabled/
   # Edit /etc/nginx/sites-available/nextgen and update server_name
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **Start with PM2** (recommended)
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name nextgen
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

### Option 2: Docker Deployment

1. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. **Build and run**
   ```bash
   docker build -t nextgen-web .
   docker run -d -p 3000:3000 --name nextgen nextgen-web
   ```

3. **Configure Nginx** (same as above)

### SSL/HTTPS Setup (Recommended)

1. **Install Certbot**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Get SSL certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Update nginx.conf** to use HTTPS (uncomment HTTPS section)

## API Endpoints

### Public Endpoints
- `GET /api/content` - Get all content
- `GET /api/content/:key` - Get specific content
- `POST /api/members/register` - Register new member

### Protected Endpoints (require authentication)
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify token
- `PUT /api/content/:key` - Update content
- `GET /api/members` - Get all members
- `GET /api/members/export` - Export members to CSV
- `POST /api/upload` - Upload file
- `DELETE /api/upload/:filename` - Delete file

## Customization

### Colors
Edit CSS variables in `frontend/styles.css`:
```css
:root {
    --primary-green: #00ff88;
    --primary-red: #ff0040;
    /* ... */
}
```

### Content
- Use the admin panel to edit text content
- Or directly edit the database: `backend/nextgen.db`

### Logo
- Place your logo at `frontend/assets/logo.png`
- The logo will be automatically used throughout the site

## Troubleshooting

### Port already in use
```bash
# Change PORT in .env file or kill process using port 3000
sudo lsof -ti:3000 | xargs kill -9
```

### Database errors
```bash
# Delete database and restart (will recreate)
rm backend/nextgen.db
npm start
```

### Permission errors
```bash
# Fix uploads directory permissions
chmod -R 755 backend/uploads
```

## Security Notes

1. **Change default admin password** immediately
2. **Use strong JWT_SECRET** in production
3. **Enable HTTPS** for production
4. **Regular backups** of database file
5. **Keep dependencies updated**

## Support

For issues or questions, please check:
- Server logs: `pm2 logs nextgen`
- Nginx logs: `/var/log/nginx/error.log`
- Application logs: Check console output

## License

This project is created for the NextGen Community.

