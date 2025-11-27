const express = require('express');
const { query, run } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all content (public)
router.get('/', async (req, res) => {
  try {
    const content = await query('SELECT * FROM content');
    const contentMap = {};
    content.forEach(item => {
      contentMap[item.section_key] = item;
    });
    res.json(contentMap);
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific content by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const content = await query('SELECT * FROM content WHERE section_key = ?', [key]);
    
    if (content.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json(content[0]);
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update content (protected)
router.put('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { title, content: contentText, image_url, video_url, banner_url } = req.body;

    const existing = await query('SELECT * FROM content WHERE section_key = ?', [key]);
    
    if (existing.length === 0) {
      await run(
        'INSERT INTO content (section_key, title, content, image_url, video_url, banner_url) VALUES (?, ?, ?, ?, ?, ?)',
        [key, title || null, contentText || null, image_url || null, video_url || null, banner_url || null]
      );
    } else {
      await run(
        'UPDATE content SET title = ?, content = ?, image_url = ?, video_url = ?, banner_url = ?, updated_at = CURRENT_TIMESTAMP WHERE section_key = ?',
        [title || existing[0].title, contentText || existing[0].content, image_url || existing[0].image_url, video_url || existing[0].video_url, banner_url || existing[0].banner_url, key]
      );
    }

    const updated = await query('SELECT * FROM content WHERE section_key = ?', [key]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

