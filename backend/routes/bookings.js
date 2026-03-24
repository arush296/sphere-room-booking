const express = require('express');
const pool = require('../db');
const requireGoogleAuth = require('../middleware/requireGoogleAuth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Create a booking (starts as pending, requires admin approval)
router.post('/', requireGoogleAuth, async (req, res) => {
  try {
    const { room_id, start_time, end_time, purpose } = req.body;
    const student_id = req.user.email;

    // Validate required fields
    if (!room_id || !student_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate time range
    const start = new Date(start_time);
    const end = new Date(end_time);
    const now = new Date();

    if (start >= end) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }

    if (start <= now) {
      return res.status(400).json({ error: 'Cannot create bookings for past time slots' });
    }

    // Check for overlapping bookings (both pending and approved block the slot)
    const overlapCheck = await pool.query(
      `SELECT id FROM bookings
       WHERE room_id = $1
       AND start_time < $3
       AND end_time > $2
       AND status IN ('pending', 'approved')`,
      [room_id, start_time, end_time]
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Room is already booked for this time slot' });
    }

    // Create booking with pending status
    const result = await pool.query(
      `INSERT INTO bookings (room_id, student_id, start_time, end_time, purpose, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, room_id, student_id, start_time, end_time, purpose, status, created_at`,
      [room_id, student_id, start_time, end_time, purpose || null, 'pending']
    );

    res.status(201).json({
      message: 'Booking request submitted successfully. Awaiting admin approval.',
      booking: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get all bookings for a room (including pending, which blocks availability)
router.get('/room/:room_id', async (req, res) => {
  try {
    const { room_id } = req.params;

    const result = await pool.query(
      `SELECT id, room_id, start_time, end_time, status 
       FROM bookings 
       WHERE room_id = $1 
       AND status IN ('pending', 'approved')
       ORDER BY start_time`,
      [room_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get bookings by student
router.get('/student/:student_id', requireGoogleAuth, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (student_id.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: 'You can only view your own bookings' });
    }

    const result = await pool.query(
      `SELECT
        b.*,
        r.name as room_name,
        to_char(b.start_time, 'Dy, DD Mon, YYYY') as start_date_display,
        to_char(b.start_time, 'HH12:MI AM') as start_time_display,
        to_char(b.end_time, 'HH12:MI AM') as end_time_display
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.student_id = $1
       ORDER BY b.start_time DESC`,
      [student_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching student bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Cancel a booking
router.delete('/:id', requireGoogleAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM bookings WHERE id = $1 AND student_id = $2 RETURNING id',
      [id, req.user.email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or not owned by you' });
    }

    res.json({ message: 'Booking cancelled successfully', booking_id: id });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// ============ ADMIN ROUTES ============

// Get all pending bookings
router.get('/admin/pending', requireGoogleAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        b.id,
        b.room_id,
        r.name as room_name,
        r.location,
        b.student_id,
        b.purpose,
        b.status,
        b.created_at,
        to_char(b.start_time, 'Dy, DD Mon, YYYY HH12:MI AM') as start_display,
        to_char(b.end_time, 'HH12:MI AM') as end_display,
        to_char(b.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD Mon, YYYY HH12:MI AM') || ' IST' as request_time_display
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.status = 'pending'
       ORDER BY b.created_at DESC`,
      []
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pending bookings:', err);
    res.status(500).json({ error: 'Failed to fetch pending bookings' });
  }
});

// Approve a booking
router.patch('/admin/:id/approve', requireGoogleAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'approved'
       WHERE id = $1 AND status = 'pending'
       RETURNING id, room_id, student_id, status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or already processed' });
    }

    res.json({ message: 'Booking approved successfully', booking: result.rows[0] });
  } catch (err) {
    console.error('Error approving booking:', err);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

// Reject a booking
router.patch('/admin/:id/reject', requireGoogleAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'rejected'
       WHERE id = $1 AND status = 'pending'
       RETURNING id, room_id, student_id, status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or already processed' });
    }

    res.json({ message: 'Booking rejected successfully', booking: result.rows[0] });
  } catch (err) {
    console.error('Error rejecting booking:', err);
    res.status(500).json({ error: 'Failed to reject booking' });
  }
});

module.exports = router;
