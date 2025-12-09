const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'nextgen.db');
const db = new sqlite3.Database(dbPath);

const init = () => {
  return new Promise((resolve, reject) => {
    // Members table
      db.run(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        age INTEGER,
        date_of_birth TEXT,
        gender TEXT NOT NULL,
        state TEXT NOT NULL,
        lga TEXT NOT NULL,
        occupation TEXT,
        is_student INTEGER DEFAULT 0,
        institution TEXT,
        is_registered_voter INTEGER DEFAULT 0,
        voter_state TEXT,
        not_registered_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating members table:', err);
        return reject(err);
      }

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
      `, (err) => {
        if (err) {
          console.error('Error creating content table:', err);
          return reject(err);
        }

        // Admin users table
        db.run(`
          CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating admin_users table:', err);
            return reject(err);
          }

          // Initialize default admin (username: admin, password: admin123)
          const bcrypt = require('bcryptjs');
          const defaultPassword = bcrypt.hashSync('admin123', 10);
          db.run(`
            INSERT OR IGNORE INTO admin_users (username, password) 
            VALUES ('admin', ?)
          `, [defaultPassword], (err) => {
            if (err) {
              console.error('Error creating default admin:', err);
              return reject(err);
            }

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

            let completed = 0;
            const total = defaultContent.length;

            if (total === 0) {
              // Create conferences table
              db.run(`
                CREATE TABLE IF NOT EXISTS conferences (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  description TEXT,
                  date TEXT,
                  time TEXT,
                  venue TEXT,
                  address TEXT,
                  banner TEXT,
                  speakers TEXT,
                  agenda TEXT,
                  guidelines TEXT,
                  status TEXT DEFAULT 'draft',
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `, (err) => {
                if (err) {
                  console.error('Error creating conferences table:', err);
                  return reject(err);
                }

                // Create institution_reps table
                db.run(`
                  CREATE TABLE IF NOT EXISTS institution_reps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conference_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    institution TEXT NOT NULL,
                    referral_code TEXT UNIQUE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (conference_id) REFERENCES conferences(id)
                  )
                `, (err) => {
                  if (err) {
                    console.error('Error creating institution_reps table:', err);
                    return reject(err);
                  }

                  // Create rep_assignments table
                  db.run(`
                    CREATE TABLE IF NOT EXISTS rep_assignments (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      registration_id INTEGER NOT NULL,
                      rep_id INTEGER NOT NULL,
                      assignment_type TEXT NOT NULL,
                      assigned_by INTEGER,
                      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY (registration_id) REFERENCES registrations(id),
                      FOREIGN KEY (rep_id) REFERENCES institution_reps(id)
                    )
                  `, (err) => {
                    if (err) {
                      console.error('Error creating rep_assignments table:', err);
                      return reject(err);
                    }

                    // Create registrations table
                    db.run(`
                      CREATE TABLE IF NOT EXISTS registrations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        conference_id INTEGER NOT NULL,
                        fullname TEXT NOT NULL,
                        email TEXT NOT NULL,
                        phone TEXT NOT NULL,
                        age INTEGER,
                        date_of_birth TEXT,
                        state TEXT NOT NULL,
                        organization TEXT,
                        is_student INTEGER DEFAULT 0,
                        institution TEXT,
                        is_registered_voter INTEGER DEFAULT 0,
                        voter_state TEXT,
                        attendance_type TEXT NOT NULL,
                        referral_code TEXT,
                        qr_code_path TEXT,
                        attendee_code TEXT UNIQUE NOT NULL,
                        checked_in INTEGER DEFAULT 0,
                        checkin_time DATETIME,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (conference_id) REFERENCES conferences(id)
                      )
                    `, (err) => {
                      if (err) {
                        console.error('Error creating registrations table:', err);
                        return reject(err);
                      }

                      if (total === 0) {
                        console.log('Database initialized');
                        return resolve();
                      }

                      defaultContent.forEach(item => {
                        db.run(`
                          INSERT OR IGNORE INTO content (section_key, title, content)
                          VALUES (?, ?, ?)
                        `, [item.section_key, item.title, item.content], (err) => {
                          if (err) {
                            console.error(`Error inserting content for ${item.section_key}:`, err);
                          }
                          completed++;
                          if (completed === total) {
                            console.log('Database initialized');
                            resolve();
                          }
                        });
                      });
                    });
                  });
                });
              });
            } else {
              defaultContent.forEach(item => {
                db.run(`
                  INSERT OR IGNORE INTO content (section_key, title, content)
                  VALUES (?, ?, ?)
                `, [item.section_key, item.title, item.content], (err) => {
                  if (err) {
                    console.error(`Error inserting content for ${item.section_key}:`, err);
                  }
                  completed++;
                  if (completed === total) {
                    console.log('Database initialized');
                    resolve();
                  }
                });
              });
            }
          });
        });
      });
    });
  });
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

// Migration function for hero slides and conference featured_in_slider
const migrate = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create hero_slides table
      db.run(`
        CREATE TABLE IF NOT EXISTS hero_slides (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          subtitle TEXT,
          buttons TEXT,
          background_image_path TEXT,
          overlay_alignment TEXT DEFAULT 'center',
          order_index INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          is_conference_slide INTEGER DEFAULT 0,
          conference_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conference_id) REFERENCES conferences(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating hero_slides table:', err);
          return reject(err);
        }

        // Add featured_in_slider column to conferences (ignore if already exists)
        db.run(`ALTER TABLE conferences ADD COLUMN featured_in_slider INTEGER DEFAULT 0`, (err2) => {
          if (err2 && !/duplicate column name/i.test(err2.message)) {
            console.error('Error adding featured_in_slider column:', err2);
            return reject(err2);
          }
          
          // Try to remove NOT NULL constraint from date column if it exists
          // SQLite doesn't support ALTER COLUMN, so we'll handle this in the application code
          // by allowing empty strings instead of NULL
          console.log('Hero slides migration completed');
          resolve();
        });
      });
    });
  });
};

module.exports = { db, init, query, run, migrate };

