const express = require('express');
const router = express.Router();
const { query, run } = require('../database');
const { authenticateToken } = require('./auth');
const { v4: uuidv4 } = require('uuid');

// Generate unique referral code
function generateReferralCode() {
  return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
}

// Get all reps for a conference (admin)
router.get('/conference/:conferenceId', authenticateToken, async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const reps = await query(
      'SELECT * FROM institution_reps WHERE conference_id = ? ORDER BY institution, name',
      [conferenceId]
    );
    res.json(reps);
  } catch (error) {
    console.error('Get reps error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single rep by ID (admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const reps = await query('SELECT * FROM institution_reps WHERE id = ?', [id]);
    if (reps.length === 0) {
      return res.status(404).json({ error: 'Rep not found' });
    }
    res.json(reps[0]);
  } catch (error) {
    console.error('Get rep error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new rep (admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { conference_id, name, email, phone, institution } = req.body;

    if (!conference_id || !name || !email || !phone || !institution) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Generate unique referral code
    let referralCode = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await query('SELECT id FROM institution_reps WHERE referral_code = ?', [referralCode]);
      if (existing.length === 0) break;
      referralCode = generateReferralCode();
      attempts++;
    }

    const result = await run(
      'INSERT INTO institution_reps (conference_id, name, email, phone, institution, referral_code) VALUES (?, ?, ?, ?, ?, ?)',
      [conference_id, name, email, phone, institution, referralCode]
    );

    const newRep = await query('SELECT * FROM institution_reps WHERE id = ?', [result.id]);
    res.status(201).json(newRep[0]);
  } catch (error) {
    console.error('Create rep error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a rep (admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, institution } = req.body;

    if (!name || !email || !phone || !institution) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await run(
      'UPDATE institution_reps SET name = ?, email = ?, phone = ?, institution = ? WHERE id = ?',
      [name, email, phone, institution, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rep not found' });
    }

    const updatedRep = await query('SELECT * FROM institution_reps WHERE id = ?', [id]);
    res.json(updatedRep[0]);
  } catch (error) {
    console.error('Update rep error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a rep (admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if rep has assignments
    const assignments = await query('SELECT id FROM rep_assignments WHERE rep_id = ?', [id]);
    if (assignments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete rep with existing assignments. Please reassign attendees first.' 
      });
    }

    const result = await run('DELETE FROM institution_reps WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rep not found' });
    }

    res.json({ message: 'Rep deleted successfully' });
  } catch (error) {
    console.error('Delete rep error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get rep by referral code (public - for registration)
router.get('/referral/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const reps = await query('SELECT * FROM institution_reps WHERE referral_code = ?', [code]);
    if (reps.length === 0) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }
    res.json(reps[0]);
  } catch (error) {
    console.error('Get rep by referral code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get rep by institution for a conference (for auto-assignment)
router.get('/conference/:conferenceId/institution/:institution', authenticateToken, async (req, res) => {
  try {
    const { conferenceId, institution } = req.params;
    const reps = await query(
      'SELECT * FROM institution_reps WHERE conference_id = ? AND institution = ?',
      [conferenceId, institution]
    );
    if (reps.length === 0) {
      return res.status(404).json({ error: 'No rep found for this institution' });
    }
    // Return the first rep if multiple exist
    res.json(reps[0]);
  } catch (error) {
    console.error('Get rep by institution error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

