const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'nextgen.db');
const db = new sqlite3.Database(dbPath);

const init = () => {
  // Members table
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      state TEXT NOT NULL,
      lga TEXT NOT NULL,
      occupation TEXT,
      is_registered_voter INTEGER DEFAULT 0,
      not_registered_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Content table for editable sections
  db.run(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT UNIQUE NOT NULL,
      title TEXT,
      content TEXT,
      image_url TEXT,
      video_url TEXT,
      banner_url TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Admin users table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initialize default admin (username: admin, password: admin123)
  const bcrypt = require('bcryptjs');
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT OR IGNORE INTO admin_users (username, password) 
    VALUES ('admin', ?)
  `, [defaultPassword]);

  // Initialize default content
  const defaultContent = [
    {
      section_key: 'hero_tagline',
      title: 'Empowering the Next Generation',
      content: 'Building political awareness and voter education for Nigerian youth aged 15-25'
    },
    {
      section_key: 'mission_statement',
      title: 'Our Mission',
      content: 'To empower Nigerian youth through political awareness, voter education, and civic engagement. We focus on ages 15-25, providing the tools and knowledge needed to participate actively in the democratic process.'
    },
    {
      section_key: 'about',
      title: 'About The NextGen Community',
      content: 'The NextGen Community is a youth-focused organization dedicated to fostering political awareness and civic engagement among young Nigerians. We believe in empowering the next generation with knowledge, skills, and opportunities to shape their future.'
    }
  ];

  defaultContent.forEach(item => {
    db.run(`
      INSERT OR IGNORE INTO content (section_key, title, content)
      VALUES (?, ?, ?)
    `, [item.section_key, item.title, item.content]);
  });

  console.log('Database initialized');
};

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = { db, init, query, run };

