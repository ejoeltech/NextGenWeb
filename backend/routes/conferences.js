const express = require('express');
const { query, run } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Helper function to sync conference with hero slider
async function upsertConferenceHeroSlide(conference) {
  try {
    // Check if conference should be featured
    const isFeatured = conference.featured_in_slider === 1 || conference.featured_in_slider === true;
    
    if (!isFeatured || conference.status !== 'published') {
      // Deactivate existing conference slide if exists
      await run(
        `UPDATE hero_slides SET is_active = 0 WHERE conference_id = ? AND is_conference_slide = 1`,
        [conference.id]
      );
      return;
    }

    // Build subtitle from date and venue
    const subtitleParts = [];
    if (conference.date) {
      const date = new Date(conference.date);
      subtitleParts.push(date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    }
    if (conference.venue) subtitleParts.push(conference.venue);
    const subtitle = subtitleParts.join(' • ');

    // Check if slide already exists
    const existing = await query(
      'SELECT * FROM hero_slides WHERE conference_id = ? AND is_conference_slide = 1',
      [conference.id]
    );

    const buttons = [{
      text: 'Learn More',
      url: `/conference/${conference.id}`,
      style: 'primary' // primary or secondary
    }];

    if (existing.length === 0) {
      // Create new slide
      const rows = await query('SELECT COALESCE(MAX(order_index), 0) AS maxOrder FROM hero_slides');
      const nextOrder = (rows[0]?.maxOrder || 0) + 1;

      await run(
        `INSERT INTO hero_slides
         (title, subtitle, buttons, background_image_path, overlay_alignment,
          order_index, is_active, is_conference_slide, conference_id)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?)`,
        [
          conference.title,
          subtitle || null,
          JSON.stringify(buttons),
          conference.banner || null,
          'left',
          nextOrder,
          conference.id
        ]
      );
    } else {
      // Update existing slide (preserve order_index and overlay_alignment)
      const slide = existing[0];
      await run(
        `UPDATE hero_slides
         SET title = ?, subtitle = ?, buttons = ?, background_image_path = ?, is_active = 1
         WHERE id = ?`,
        [
          conference.title,
          subtitle || null,
          JSON.stringify(buttons),
          conference.banner || slide.background_image_path,
          slide.id
        ]
      );
    }
  } catch (err) {
    console.error('Error syncing conference hero slide:', err);
  }
}

// Get all conferences (public - only published)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM conferences';
    let params = [];

    if (status === 'all') {
      // Admin can see all
      sql += ' ORDER BY date DESC, created_at DESC';
    } else {
      // Public only sees published
      sql += ' WHERE status = ? ORDER BY date DESC';
      params.push('published');
    }

    const conferences = await query(sql, params);
    
    // Parse JSON fields
    const parsed = conferences.map(conf => ({
      ...conf,
      speakers: conf.speakers ? JSON.parse(conf.speakers) : [],
      agenda: conf.agenda ? JSON.parse(conf.agenda) : []
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Get conferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single conference (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conferences = await query('SELECT * FROM conferences WHERE id = ?', [id]);
    
    if (conferences.length === 0) {
      return res.status(404).json({ error: 'Conference not found' });
    }

    const conference = conferences[0];
    conference.speakers = conference.speakers ? JSON.parse(conference.speakers) : [];
    conference.agenda = conference.agenda ? JSON.parse(conference.agenda) : [];

    res.json(conference);
  } catch (error) {
    console.error('Get conference error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create conference (protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      venue,
      address,
      banner,
      speakers,
      agenda,
      guidelines,
      status,
      featured_in_slider
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const result = await run(
      `INSERT INTO conferences (title, description, date, time, venue, address, banner, speakers, agenda, guidelines, status, featured_in_slider)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        date,
        time || null,
        venue || null,
        address || null,
        banner || null,
        speakers ? JSON.stringify(speakers) : null,
        agenda ? JSON.stringify(agenda) : null,
        guidelines || null,
        status || 'draft',
        featured_in_slider ? 1 : 0
      ]
    );

    const newConference = await query('SELECT * FROM conferences WHERE id = ?', [result.id]);
    const conf = newConference[0];
    conf.speakers = conf.speakers ? JSON.parse(conf.speakers) : [];
    conf.agenda = conf.agenda ? JSON.parse(conf.agenda) : [];
    conf.featured_in_slider = conf.featured_in_slider || 0;

    // Auto-sync hero slide if featured
    await upsertConferenceHeroSlide(conf);

    res.json(conf);
  } catch (error) {
    console.error('Create conference error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update conference (protected)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      date,
      time,
      venue,
      address,
      banner,
      speakers,
      agenda,
      guidelines,
      status,
      featured_in_slider
    } = req.body;

    await run(
      `UPDATE conferences 
       SET title = ?, description = ?, date = ?, time = ?, venue = ?, address = ?, 
           banner = ?, speakers = ?, agenda = ?, guidelines = ?, status = ?,
           featured_in_slider = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        description || null,
        date,
        time || null,
        venue || null,
        address || null,
        banner || null,
        speakers ? JSON.stringify(speakers) : null,
        agenda ? JSON.stringify(agenda) : null,
        guidelines || null,
        status || 'draft',
        featured_in_slider ? 1 : 0,
        id
      ]
    );

    const updated = await query('SELECT * FROM conferences WHERE id = ?', [id]);
    const conf = updated[0];
    conf.speakers = conf.speakers ? JSON.parse(conf.speakers) : [];
    conf.agenda = conf.agenda ? JSON.parse(conf.agenda) : [];
    conf.featured_in_slider = conf.featured_in_slider || 0;

    // Auto-sync hero slide if featured
    await upsertConferenceHeroSlide(conf);

    res.json(conf);
  } catch (error) {
    console.error('Update conference error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete conference (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are registrations
    const registrations = await query('SELECT COUNT(*) as count FROM registrations WHERE conference_id = ?', [id]);
    if (registrations[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete conference with existing registrations' });
    }

    await run('DELETE FROM conferences WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete conference error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

