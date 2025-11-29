const express = require('express');
const router = express.Router();
const { query, run } = require('../database');
const { authenticateToken } = require('./auth');

// Helper to get next order index
async function getNextOrderIndex() {
  const rows = await query('SELECT COALESCE(MAX(order_index), 0) AS maxOrder FROM hero_slides');
  return (rows[0]?.maxOrder || 0) + 1;
}

// Public: Get active slides
router.get('/', async (req, res) => {
  try {
    const slides = await query(
      `SELECT * FROM hero_slides
       WHERE is_active = 1
       ORDER BY order_index ASC, created_at ASC`
    );
    
    // Parse buttons JSON
    const parsed = slides.map(slide => ({
      ...slide,
      buttons: slide.buttons ? JSON.parse(slide.buttons) : []
    }));
    
    res.json(parsed);
  } catch (err) {
    console.error('Error fetching hero slides:', err);
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Admin: Get all slides
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const slides = await query(
      `SELECT hs.*, c.title AS conference_title
       FROM hero_slides hs
       LEFT JOIN conferences c ON hs.conference_id = c.id
       ORDER BY order_index ASC, created_at ASC`
    );
    
    // Parse buttons JSON
    const parsed = slides.map(slide => ({
      ...slide,
      buttons: slide.buttons ? JSON.parse(slide.buttons) : []
    }));
    
    res.json(parsed);
  } catch (err) {
    console.error('Error fetching all hero slides:', err);
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Admin: Create manual slide
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      buttons,
      background_image_path,
      overlay_alignment,
      is_active
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const order_index = await getNextOrderIndex();
    const buttonsJson = Array.isArray(buttons) ? JSON.stringify(buttons) : '[]';

    const result = await run(
      `INSERT INTO hero_slides
       (title, subtitle, buttons, background_image_path, overlay_alignment,
        order_index, is_active, is_conference_slide, conference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL)`,
      [
        title,
        subtitle || null,
        buttonsJson,
        background_image_path || null,
        overlay_alignment || 'left',
        order_index,
        is_active ? 1 : 0
      ]
    );

    const rows = await query('SELECT * FROM hero_slides WHERE id = ?', [result.id]);
    const slide = rows[0];
    slide.buttons = slide.buttons ? JSON.parse(slide.buttons) : [];
    
    res.status(201).json(slide);
  } catch (err) {
    console.error('Error creating hero slide:', err);
    res.status(500).json({ error: 'Failed to create hero slide' });
  }
});

// Admin: Update slide
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      buttons,
      background_image_path,
      overlay_alignment,
      is_active
    } = req.body;

    const buttonsJson = Array.isArray(buttons) ? JSON.stringify(buttons) : '[]';

    const result = await run(
      `UPDATE hero_slides
       SET title = ?, subtitle = ?, buttons = ?, background_image_path = ?,
           overlay_alignment = ?, is_active = ?
       WHERE id = ?`,
      [
        title,
        subtitle || null,
        buttonsJson,
        background_image_path || null,
        overlay_alignment || 'left',
        is_active ? 1 : 0,
        id
      ]
    );

    if (!result.changes) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    const rows = await query('SELECT * FROM hero_slides WHERE id = ?', [id]);
    const slide = rows[0];
    slide.buttons = slide.buttons ? JSON.parse(slide.buttons) : [];
    
    res.json(slide);
  } catch (err) {
    console.error('Error updating hero slide:', err);
    res.status(500).json({ error: 'Failed to update hero slide' });
  }
});

// Admin: Delete slide
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run('DELETE FROM hero_slides WHERE id = ?', [id]);
    
    if (!result.changes) {
      return res.status(404).json({ error: 'Slide not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting hero slide:', err);
    res.status(500).json({ error: 'Failed to delete hero slide' });
  }
});

// Admin: Reorder slides
router.put('/reorder', authenticateToken, async (req, res) => {
  try {
    const { order } = req.body; // [{id, order_index}, ...]
    
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Invalid order payload' });
    }

    await Promise.all(order.map(item =>
      run('UPDATE hero_slides SET order_index = ? WHERE id = ?', [item.order_index, item.id])
    ));

    res.json({ success: true });
  } catch (err) {
    console.error('Error reordering hero slides:', err);
    res.status(500).json({ error: 'Failed to reorder slides' });
  }
});

module.exports = router;
