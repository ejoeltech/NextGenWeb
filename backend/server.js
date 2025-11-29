const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/qrcodes', express.static(path.join(__dirname, 'uploads/qrcodes')));

// Database
const db = require('./database');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/members', require('./routes/members'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/conferences', require('./routes/conferences'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/reps', require('./routes/reps'));
app.use('/api/rep-assignments', require('./routes/rep-assignments'));
app.use('/api/hero-slides', require('./routes/hero-slides'));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Serve conference pages
app.get('/conferences', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/conferences.html'));
});

app.get('/conference/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/conference-detail.html'));
});

app.get('/conference/:id/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/conference-register.html'));
});

app.get('/conference/:id/confirmation', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/conference-confirmation.html'));
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database before starting server
db.init()
  .then(() => db.migrate())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

