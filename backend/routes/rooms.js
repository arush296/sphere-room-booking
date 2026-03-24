const express = require('express');
const pool = require('../db');
const requireGoogleAuth = require('../middleware/requireGoogleAuth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching room:', err);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get room availability for a specific date
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date query parameter required' });
    }

    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59.999`);

    const result = await pool.query(
      `SELECT
        start_time,
        end_time,
        to_char(start_time, 'HH24:MI') AS start_time_hhmm,
        to_char(end_time, 'HH24:MI') AS end_time_hhmm
       FROM bookings
       WHERE room_id = $1
       AND start_time < $3
       AND end_time > $2
       AND status IN ('pending', 'approved')
       ORDER BY start_time`,
      [id, startOfDay, endOfDay]
    );

    res.json({
      room_id: id,
      date,
      bookings: result.rows.map(row => ({
        start_time: row.start_time,
        end_time: row.end_time,
        start_time_hhmm: row.start_time_hhmm,
        end_time_hhmm: row.end_time_hhmm
      }))
    });
  } catch (err) {
    console.error('Error fetching availability:', err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Update a room
router.put('/:id', requireGoogleAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, location, amenities } = req.body;

    // Validate required fields
    if (!name || !capacity) {
      return res.status(400).json({ error: 'Name and capacity are required' });
    }

    const result = await pool.query(
      'UPDATE rooms SET name = $1, capacity = $2, location = $3, amenities = $4 WHERE id = $5 RETURNING *',
      [name, capacity, location, amenities, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Create a new room
router.post('/', requireGoogleAuth, requireAdmin, async (req, res) => {
  try {
    const { name, capacity, location, amenities } = req.body;

    // Validate required fields
    if (!name || !capacity) {
      return res.status(400).json({ error: 'Name and capacity are required' });
    }

    const result = await pool.query(
      'INSERT INTO rooms (name, capacity, location, amenities) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, capacity, location, amenities]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Delete a room
router.delete('/:id', requireGoogleAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully', room: result.rows[0] });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;
