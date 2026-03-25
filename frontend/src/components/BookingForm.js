import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TimelineAvailability from './TimelineAvailability';
import './BookingForm.css';

function BookingForm({ room, studentId, onBack, onBookingSuccess }) {
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getLocalDateString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;

  const getRoundedCurrentHour = () => {
    const now = new Date();
    let nextHour = now.getHours();
    if (now.getMinutes() > 0 || now.getSeconds() > 0 || now.getMilliseconds() > 0) {
      nextHour += 1;
    }
    return nextHour;
  };

  const getTodayString = () => getLocalDateString();

  const toMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isTodaySelected = date === getTodayString();
  const minStartHourForToday = Math.max(8, getRoundedCurrentHour());
  const hasNoFutureSlotsToday = isTodaySelected && minStartHourForToday > 22;
  const minStartTime = isTodaySelected
    ? `${String(Math.min(minStartHourForToday, 22)).padStart(2, '0')}:00`
    : '08:00';

  const addOneHour = useCallback((timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 60;
    const cappedMinutes = Math.min(totalMinutes, 23 * 60);
    const nextHours = Math.floor(cappedMinutes / 60);
    const nextMinutes = cappedMinutes % 60;

    return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
  }, []);

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/rooms/${room.id}/availability?date=${date}`
      );
      setAvailability(response.data.bookings);
      setError('');
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL, room.id, date]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    if (hasNoFutureSlotsToday) {
      setError('No future slots are available for today. Please choose a later date.');
      return;
    }

    if (isTodaySelected && toMinutes(startTime) < toMinutes(minStartTime)) {
      setStartTime(minStartTime);
      setEndTime(addOneHour(minStartTime));
    }
  }, [hasNoFutureSlotsToday, isTodaySelected, startTime, minStartTime, addOneHour]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);
      const now = new Date();

      if (startDateTime <= now) {
        setError('Please choose a time slot in the future');
        setSubmitted(false);
        return;
      }

      if (endDateTime.getTime() - startDateTime.getTime() !== 60 * 60 * 1000) {
        setError('Bookings must be exactly 1 hour long');
        setSubmitted(false);
        return;
      }

      const response = await axios.post(`${API_URL}/bookings`, {
        room_id: room.id,
        start_time: `${date}T${startTime}:00`,
        end_time: `${date}T${endTime}:00`,
        purpose: purpose
      });

      if (response.status === 201) {
        alert('Your request has been submitted successfully! Awaiting admin approval.');
        onBookingSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking');
      console.error('Booking error:', err);
    } finally {
      setSubmitted(false);
    }
  };

  return (
    <div className="booking-form-container">
      <button className="back-button" onClick={onBack}>
        ← Back to Rooms
      </button>

      <div className="booking-form-card">
        <h2>Book {room.name}</h2>
        <p className="room-info">📍 {room.location || 'Location TBA'}</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">Select Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={getTodayString()}
              required
            />
          </div>

          <div className="timeline-section">
            <h3>Room Availability for {date}</h3>
            {loading ? (
              <p className="loading-text">Loading availability...</p>
            ) : (
              <TimelineAvailability
                bookings={availability}
                selectedDate={date}
                selectedStartTime={startTime}
                selectedEndTime={endTime}
                onTimeSelect={(start, end) => {
                  setStartTime(start);
                  setEndTime(end);
                }}
              />
            )}
          </div>

          <div className="time-inputs">
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => {
                  const selectedStart = e.target.value;

                  if (isTodaySelected && toMinutes(selectedStart) < toMinutes(minStartTime)) {
                    setError('Please choose a future time slot');
                    return;
                  }

                  setError('');
                  setStartTime(selectedStart);
                  setEndTime(addOneHour(selectedStart));
                }}
                min={minStartTime}
                max="22:00"
                step="3600"
                disabled={hasNoFutureSlotsToday}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                readOnly
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="purpose">Purpose (Optional)</label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What will you use this room for?"
              rows="3"
            />
          </div>

          <div className="booking-summary">
            <h3>Booking Summary</h3>
            <p><strong>Room:</strong> {room.name}</p>
            <p><strong>Date:</strong> {date}</p>
            <p><strong>Time:</strong> {startTime} - {endTime}</p>
            {purpose && <p><strong>Purpose:</strong> {purpose}</p>}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={submitted || hasNoFutureSlotsToday}
          >
            {submitted ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BookingForm;
