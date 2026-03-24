import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RoomManagement from './RoomManagement';
import './AdminApproval.css';

function AdminApproval({ rooms, onRoomUpdated }) {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const [adminSection, setAdminSection] = useState('approvals');

  const API_URL = process.env.REACT_APP_API_URL;

  const fetchPendingBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/bookings/admin/pending`);
      setPendingBookings(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch pending bookings:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        headers: axios.defaults.headers.common
      });
      setError(err.response?.data?.error || 'Failed to load pending bookings');
      setPendingBookings([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchPendingBookings();
    // Refresh pending bookings every 30 seconds
    const interval = setInterval(fetchPendingBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingBookings]);

  const handleApprove = async (bookingId) => {
    try {
      setProcessing(bookingId);
      await axios.patch(`${API_URL}/bookings/admin/${bookingId}/approve`);
      setPendingBookings(pendingBookings.filter(b => b.id !== bookingId));
      alert('Booking approved successfully');
    } catch (err) {
      setError('Failed to approve booking');
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (bookingId) => {
    try {
      setProcessing(bookingId);
      await axios.patch(`${API_URL}/bookings/admin/${bookingId}/reject`);
      setPendingBookings(pendingBookings.filter(b => b.id !== bookingId));
      alert('Booking rejected successfully');
    } catch (err) {
      setError('Failed to reject booking');
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading && pendingBookings.length === 0) {
    return <div className="admin-loading">Loading pending bookings...</div>;
  }

  return (
    <div className="admin-approval-container">
      <div className="admin-section-tabs">
        <button
          type="button"
          className={`admin-section-tab ${adminSection === 'approvals' ? 'active' : ''}`}
          onClick={() => setAdminSection('approvals')}
        >
          Booking Approvals
        </button>
        <button
          type="button"
          className={`admin-section-tab ${adminSection === 'rooms' ? 'active' : ''}`}
          onClick={() => setAdminSection('rooms')}
        >
          Manage Rooms
        </button>
      </div>

      {adminSection === 'rooms' && (
        <RoomManagement
          rooms={rooms}
          onRoomUpdated={onRoomUpdated}
          API_URL={API_URL}
        />
      )}

      {adminSection === 'approvals' && (
        <>
      <div className="admin-header">
        <h2>Booking Approvals</h2>
        <span className="pending-count">
          {pendingBookings.length} Pending {pendingBookings.length === 1 ? 'Request' : 'Requests'}
        </span>
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      {pendingBookings.length === 0 ? (
        <div className="no-pending-bookings">
          <p>No pending booking requests at the moment.</p>
          <p>All new requests will appear here for approval.</p>
        </div>
      ) : (
        <div className="pending-bookings-list">
          {pendingBookings.map((booking) => (
            <div key={booking.id} className="pending-booking-card">
              <div className="booking-card-left">
                <div className="booking-info-block">
                  <h3 className="room-title">{booking.room_name}</h3>
                  <p className="room-location">📍 {booking.location}</p>
                </div>

                <div className="booking-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Student Email:</span>
                    <span className="detail-value">{booking.student_id}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Time Slot:</span>
                    <span className="detail-value">{booking.start_display} - {booking.end_display}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Purpose:</span>
                    <span className="detail-value">{booking.purpose || 'Not specified'}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Requested:</span>
                    <span className="detail-value">{booking.request_time_display}</span>
                  </div>
                </div>
              </div>

              <div className="booking-card-right">
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(booking.id)}
                  disabled={processing === booking.id}
                >
                  {processing === booking.id ? '⏳ Processing...' : 'Approve'}
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleReject(booking.id)}
                  disabled={processing === booking.id}
                >
                  {processing === booking.id ? '⏳ Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default AdminApproval;
