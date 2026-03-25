import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './MyBookings.css';

function MyBookings({ studentId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [showApprovedOnly, setShowApprovedOnly] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/bookings/student/${studentId}`);
      setBookings(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL, studentId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.delete(`${API_URL}/bookings/${bookingId}`);
      setBookings(bookings.filter(b => b.id !== bookingId));
      setCancelConfirm(null);
      alert('✅ Booking cancelled successfully');
    } catch (err) {
      setError('Failed to cancel booking');
      console.error(err);
    }
  };

  const formatDate = (booking) => {
    if (booking.start_date_display) return booking.start_date_display;

    const date = new Date(booking.start_time);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeRange = (booking) => {
    if (booking.start_time_display && booking.end_time_display) {
      return `${booking.start_time_display} - ${booking.end_time_display} IST`;
    }

    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    return `${start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST`;
  };

  const isUpcoming = (startTime) => {
    return new Date(startTime) > new Date();
  };

  const visibleBookings = showApprovedOnly
    ? bookings.filter((booking) => booking.status === 'approved')
    : bookings;

  if (loading) return <div className="loading">Loading your bookings...</div>;

  return (
    <div className="my-bookings-container">
      <h2>My Bookings</h2>
      {error && <div className="error-message">{error}</div>}

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>You don't have any bookings yet.</p>
          <p>Browse available rooms to make your first booking!</p>
        </div>
      ) : (
        <>
          <div className="bookings-filter">
            <span className="filter-label">
              Showing {visibleBookings.length} booking{visibleBookings.length !== 1 ? 's' : ''}
            </span>
            <div className="filter-controls">
              <button
                type="button"
                className={`approval-only-toggle ${showApprovedOnly ? 'active' : ''}`}
                onClick={() => setShowApprovedOnly((prev) => !prev)}
              >
                {showApprovedOnly ? 'Showing Approved Only' : 'Show Approved Bookings Only'}
              </button>
            </div>
          </div>

          <div className="bookings-list">
            {visibleBookings.length === 0 && (
              <div className="no-bookings">
                <p>No approved bookings found.</p>
                <p>Turn off the filter to see all booking statuses.</p>
              </div>
            )}

            {visibleBookings.map((booking) => {
              const upcoming = isUpcoming(booking.start_time);
              const getApprovalStatusDisplay = () => {
                switch (booking.status) {
                  case 'approved':
                    return `✅ Approved`;
                  case 'pending':
                    return `⏳ Pending Approval`;
                  case 'rejected':
                    return `❌ Rejected`;
                  default:
                    return `⏳ Pending Approval`;
                }
              };
              
              return (
                <div key={booking.id} className={`booking-item ${upcoming ? 'upcoming' : 'past'} status-${booking.status}`}>
                  <div className="booking-item-header">
                    <div className="booking-title">
                      <h3>{booking.room_name}</h3>
                      <div className="status-badges">
                        <span className={`status-badge ${booking.status}`}>
                          {getApprovalStatusDisplay()}
                        </span>
                        <span className={`time-status-badge ${upcoming ? 'upcoming' : 'past'}`}>
                          {upcoming ? '⏳ Upcoming' : '✓ Past'}
                        </span>
                      </div>
                    </div>
                    <div className="booking-actions">
                      {upcoming && booking.status !== 'rejected' && cancelConfirm !== booking.id && (
                        <button
                          className="cancel-button"
                          onClick={() => setCancelConfirm(booking.id)}
                        >
                          ✕ Cancel
                        </button>
                      )}
                      {cancelConfirm === booking.id && (
                        <div className="cancel-confirm">
                          <p>Are you sure?</p>
                          <button
                            className="confirm-yes"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Yes
                          </button>
                          <button
                            className="confirm-no"
                            onClick={() => setCancelConfirm(null)}
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="booking-details">
                    <div className="detail">
                      <span className="label">Date:</span>
                      <span className="value">{formatDate(booking)}</span>
                    </div>
                    <div className="detail">
                      <span className="label">Time:</span>
                      <span className="value">
                        {formatTimeRange(booking)}
                      </span>
                    </div>
                    {booking.purpose && (
                      <div className="detail">
                        <span className="label">Purpose:</span>
                        <span className="value">{booking.purpose}</span>
                      </div>
                    )}
                    <div className="detail">
                      <span className="label">Booking ID:</span>
                      <span className="value">{booking.id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default MyBookings;
