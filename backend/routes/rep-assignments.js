const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('./auth');

// Get all assignments for a conference (admin)
router.get('/conference/:conferenceId', authenticateToken, async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const assignments = await db.query(`
      SELECT 
        ra.*,
        r.fullname as attendee_name,
        r.email as attendee_email,
        r.phone as attendee_phone,
        r.institution,
        ir.name as rep_name,
        ir.email as rep_email,
        ir.phone as rep_phone,
        ir.institution as rep_institution
      FROM rep_assignments ra
      JOIN registrations r ON ra.registration_id = r.id
      JOIN institution_reps ir ON ra.rep_id = ir.id
      WHERE r.conference_id = ?
      ORDER BY ra.assigned_at DESC
    `, [conferenceId]);
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get assignments for a specific rep (admin)
router.get('/rep/:repId', authenticateToken, async (req, res) => {
  try {
    const { repId } = req.params;
    const assignments = await db.query(`
      SELECT 
        ra.*,
        r.fullname as attendee_name,
        r.email as attendee_email,
        r.phone as attendee_phone,
        r.institution,
        r.checked_in,
        r.checkin_time
      FROM rep_assignments ra
      JOIN registrations r ON ra.registration_id = r.id
      WHERE ra.rep_id = ?
      ORDER BY ra.assigned_at DESC
    `, [repId]);
    res.json(assignments);
  } catch (error) {
    console.error('Get rep assignments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manually assign attendee to rep (admin)
router.post('/assign', authenticateToken, async (req, res) => {
  try {
    const { registration_id, rep_id, assigned_by } = req.body;

    if (!registration_id || !rep_id) {
      return res.status(400).json({ error: 'Registration ID and Rep ID are required' });
    }

    // Check if already assigned
    const existing = await db.query(
      'SELECT id FROM rep_assignments WHERE registration_id = ?',
      [registration_id]
    );

    if (existing.length > 0) {
      // Update existing assignment
      await db.run(
        'UPDATE rep_assignments SET rep_id = ?, assignment_type = ?, assigned_by = ?, assigned_at = CURRENT_TIMESTAMP WHERE registration_id = ?',
        [rep_id, 'manual', assigned_by || null, registration_id]
      );
    } else {
      // Create new assignment
      await db.run(
        'INSERT INTO rep_assignments (registration_id, rep_id, assignment_type, assigned_by) VALUES (?, ?, ?, ?)',
        [registration_id, rep_id, 'manual', assigned_by || null]
      );
    }

    res.json({ message: 'Attendee assigned to rep successfully' });
  } catch (error) {
    console.error('Assign attendee error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove assignment (admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.run('DELETE FROM rep_assignments WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk assign attendees to rep (admin)
router.post('/bulk-assign', authenticateToken, async (req, res) => {
  try {
    const { registration_ids, rep_id, assigned_by } = req.body;

    if (!registration_ids || !Array.isArray(registration_ids) || registration_ids.length === 0) {
      return res.status(400).json({ error: 'Registration IDs array is required' });
    }

    if (!rep_id) {
      return res.status(400).json({ error: 'Rep ID is required' });
    }

    const results = [];
    for (const regId of registration_ids) {
      const existing = await db.query(
        'SELECT id FROM rep_assignments WHERE registration_id = ?',
        [regId]
      );

      if (existing.length > 0) {
        await db.run(
          'UPDATE rep_assignments SET rep_id = ?, assignment_type = ?, assigned_by = ?, assigned_at = CURRENT_TIMESTAMP WHERE registration_id = ?',
          [rep_id, 'manual', assigned_by || null, regId]
        );
        results.push({ registration_id: regId, action: 'updated' });
      } else {
        await db.run(
          'INSERT INTO rep_assignments (registration_id, rep_id, assignment_type, assigned_by) VALUES (?, ?, ?, ?)',
          [regId, rep_id, 'manual', assigned_by || null]
        );
        results.push({ registration_id: regId, action: 'created' });
      }
    }

    res.json({ message: 'Bulk assignment completed', results });
  } catch (error) {
    console.error('Bulk assign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

