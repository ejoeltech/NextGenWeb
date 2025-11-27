const express = require('express');
const { query, run } = require('../database');
const { authenticateToken } = require('./auth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Register new member (public)
router.post('/register', async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      age,
      gender,
      state,
      lga,
      occupation,
      is_registered_voter,
      not_registered_reason
    } = req.body;

    // Validation
    if (!full_name || !phone || !email || !age || !gender || !state || !lga) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already exists
    const existing = await query('SELECT * FROM members WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    await run(
      `INSERT INTO members (full_name, phone, email, age, gender, state, lga, occupation, is_registered_voter, not_registered_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        phone,
        email,
        age,
        gender,
        state,
        lga,
        occupation || null,
        is_registered_voter ? 1 : 0,
        not_registered_reason || null
      ]
    );

    res.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all members (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const members = await query('SELECT * FROM members ORDER BY created_at DESC');
    res.json(members);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get member count (protected)
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM members');
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Get count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export members to CSV (protected)
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const members = await query('SELECT * FROM members ORDER BY created_at DESC');
    
    const csvPath = path.join(__dirname, '../uploads/members_export.csv');
    const csvWriter = createCsvWriter({
      path: csvPath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'full_name', title: 'Full Name' },
        { id: 'phone', title: 'Phone' },
        { id: 'email', title: 'Email' },
        { id: 'age', title: 'Age' },
        { id: 'gender', title: 'Gender' },
        { id: 'state', title: 'State' },
        { id: 'lga', title: 'LGA' },
        { id: 'occupation', title: 'Occupation' },
        { id: 'is_registered_voter', title: 'Registered Voter' },
        { id: 'not_registered_reason', title: 'Not Registered Reason' },
        { id: 'created_at', title: 'Registration Date' }
      ]
    });

    const formattedMembers = members.map(m => ({
      ...m,
      is_registered_voter: m.is_registered_voter ? 'Yes' : 'No'
    }));

    await csvWriter.writeRecords(formattedMembers);

    res.download(csvPath, 'nextgen_members.csv', (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(csvPath)) {
          fs.unlinkSync(csvPath);
        }
      }, 1000);
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

