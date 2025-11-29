const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { query, run } = require('../database');
const { authenticateToken } = require('./auth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const router = express.Router();

// Register for conference (public)
router.post('/register', async (req, res) => {
  try {
    const {
      conference_id,
      fullname,
      email,
      phone,
      age,
      date_of_birth,
      state,
      organization,
      is_student,
      institution,
      is_registered_voter,
      voter_state,
      attendance_type,
      referral_code,
      consent
    } = req.body;

    if (!conference_id || !fullname || !email || !phone || (!age && !date_of_birth) || !state || !attendance_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!consent) {
      return res.status(400).json({ error: 'Consent is required' });
    }

    // Check if conference exists
    const conferences = await query('SELECT * FROM conferences WHERE id = ? AND status = ?', [conference_id, 'published']);
    if (conferences.length === 0) {
      return res.status(404).json({ error: 'Conference not found or not published' });
    }

    // Check if already registered
    const existing = await query('SELECT * FROM registrations WHERE conference_id = ? AND email = ?', [conference_id, email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered for this conference' });
    }

    // Generate unique attendee code
    const attendeeCode = `NG${conference_id}${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create QR code data
    const qrData = JSON.stringify({
      attendee_code: attendeeCode,
      conference_id: conference_id,
      email: email
    });

    // Generate QR code
    const qrDir = path.join(__dirname, '../uploads/qrcodes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const qrFilename = `${attendeeCode}.png`;
    const qrPath = path.join(qrDir, qrFilename);
    await QRCode.toFile(qrPath, qrData, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300
    });

    const qrUrl = `/uploads/qrcodes/${qrFilename}`;

    // Save registration
    const result = await run(
      `INSERT INTO registrations (conference_id, fullname, email, phone, age, date_of_birth, state, organization, is_student, institution, is_registered_voter, voter_state, attendance_type, referral_code, qr_code_path, attendee_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conference_id,
        fullname,
        email,
        phone,
        age || null,
        date_of_birth || null,
        state,
        organization || null,
        is_student ? 1 : 0,
        institution || null,
        is_registered_voter ? 1 : 0,
        voter_state || null,
        attendance_type,
        referral_code || null,
        qrUrl,
        attendeeCode
      ]
    );

    // Handle rep assignment
    let assignedRepId = null;
    let assignmentType = null;

    // Check if referral code was provided
    if (referral_code) {
      const repByCode = await query('SELECT id FROM institution_reps WHERE referral_code = ? AND conference_id = ?', [referral_code, conference_id]);
      if (repByCode.length > 0) {
        assignedRepId = repByCode[0].id;
        assignmentType = 'referral';
      }
    }

    // Auto-assign if student and no referral code assignment
    if (!assignedRepId && is_student && institution) {
      const repByInstitution = await query(
        'SELECT id FROM institution_reps WHERE conference_id = ? AND institution = ?',
        [conference_id, institution]
      );
      if (repByInstitution.length > 0) {
        assignedRepId = repByInstitution[0].id;
        assignmentType = 'auto';
      }
    }

    // Create assignment if rep found
    if (assignedRepId) {
      await run(
        'INSERT INTO rep_assignments (registration_id, rep_id, assignment_type) VALUES (?, ?, ?)',
        [result.id, assignedRepId, assignmentType]
      );
    }

    const registration = await query('SELECT * FROM registrations WHERE id = ?', [result.id]);
    res.json({
      success: true,
      registration: registration[0],
      qr_code_url: qrUrl
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get registrations for a conference (protected)
router.get('/conference/:conferenceId', authenticateToken, async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const { checked_in } = req.query;

    let sql = 'SELECT * FROM registrations WHERE conference_id = ?';
    const params = [conferenceId];

    if (checked_in !== undefined) {
      sql += ' AND checked_in = ?';
      params.push(checked_in === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC';

    const registrations = await query(sql, params);
    res.json(registrations);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check in attendee (protected)
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const { attendee_code } = req.body;

    if (!attendee_code) {
      return res.status(400).json({ error: 'Attendee code required' });
    }

    const registrations = await query('SELECT * FROM registrations WHERE attendee_code = ?', [attendee_code]);

    if (registrations.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const registration = registrations[0];

    if (registration.checked_in) {
      return res.status(400).json({ 
        error: 'Already checked in',
        checkin_time: registration.checkin_time
      });
    }

    await run(
      'UPDATE registrations SET checked_in = 1, checkin_time = CURRENT_TIMESTAMP WHERE attendee_code = ?',
      [attendee_code]
    );

    const updated = await query('SELECT * FROM registrations WHERE attendee_code = ?', [attendee_code]);
    res.json({ success: true, registration: updated[0] });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify QR code (protected)
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { qr_data } = req.body;

    if (!qr_data) {
      return res.status(400).json({ error: 'QR data required' });
    }

    let data;
    try {
      data = JSON.parse(qr_data);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    const { attendee_code } = data;
    const registrations = await query('SELECT * FROM registrations WHERE attendee_code = ?', [attendee_code]);

    if (registrations.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({ registration: registrations[0] });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export registrations to CSV (protected)
router.get('/export/:conferenceId', authenticateToken, async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const registrations = await query(
      'SELECT * FROM registrations WHERE conference_id = ? ORDER BY created_at DESC',
      [conferenceId]
    );

    if (registrations.length === 0) {
      return res.status(404).json({ error: 'No registrations found' });
    }

    const csvPath = path.join(__dirname, '../uploads/registrations_export.csv');
    const csvWriter = createCsvWriter({
      path: csvPath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'attendee_code', title: 'Attendee Code' },
        { id: 'fullname', title: 'Full Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'age', title: 'Age' },
        { id: 'date_of_birth', title: 'Date of Birth' },
        { id: 'state', title: 'State' },
        { id: 'organization', title: 'Organization' },
        { id: 'is_student', title: 'Is Student' },
        { id: 'institution', title: 'Institution' },
        { id: 'is_registered_voter', title: 'Registered Voter' },
        { id: 'voter_state', title: 'Voter State' },
        { id: 'attendance_type', title: 'Attendance Type' },
        { id: 'checked_in', title: 'Checked In' },
        { id: 'checkin_time', title: 'Check-in Time' },
        { id: 'created_at', title: 'Registration Date' }
      ]
    });

    const formatted = registrations.map(r => ({
      ...r,
      is_student: r.is_student ? 'Yes' : 'No',
      is_registered_voter: r.is_registered_voter ? 'Yes' : 'No',
      checked_in: r.checked_in ? 'Yes' : 'No'
    }));

    await csvWriter.writeRecords(formatted);

    res.download(csvPath, `conference_${conferenceId}_registrations.csv`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
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

