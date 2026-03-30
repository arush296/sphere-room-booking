import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RoomManagement from './RoomManagement';
import './AdminApproval.css';

function AdminApproval({ rooms, onRoomUpdated }) {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [rejectedBookings, setRejectedBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const [adminSection, setAdminSection] = useState('approvals');
  const [bookingTab, setBookingTab] = useState('pending');

  const API_URL = process.env.REACT_APP_API_URL;

  const fetchPendingBookings = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings/admin/pending`);
      setPendingBookings(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch pending bookings:', err);
      setError(err.response?.data?.error || 'Failed to load pending bookings');
      setPendingBookings([]);
    }
  }, [API_URL]);

  const fetchApprovedBookings = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings/admin/approved`);
      setApprovedBookings(response.data);
    } catch (err) {
      console.error('Failed to fetch approved bookings:', err);
      setApprovedBookings([]);
    }
  }, [API_URL]);

  const fetchRejectedBookings = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings/admin/rejected`);
      setRejectedBookings(response.data);
    } catch (err) {
      console.error('Failed to fetch rejected bookings:', err);
      setRejectedBookings([]);
    }
  }, [API_URL]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchPendingBookings(),
      fetchApprovedBookings(),
      fetchRejectedBookings()
    ]).finally(() => setLoading(false));

    // Refresh bookings every 30 seconds
    const interval = setInterval(() => {
      Promise.all([
        fetchPendingBookings(),
        fetchApprovedBookings(),
        fetchRejectedBookings()
      ]);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPendingBookings, fetchApprovedBookings, fetchRejectedBookings]);

  const handleApprove = async (bookingId) => {
    try {
      setProcessing(bookingId);
      await axios.patch(`${API_URL}/bookings/admin/${bookingId}/approve`);
      setPendingBookings(pendingBookings.filter(b => b.id !== bookingId));
      setApprovedBookings([...approvedBookings]);
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
      setRejectedBookings([...rejectedBookings]);
      alert('Booking rejected successfully');
    } catch (err) {
      setError('Failed to reject booking');
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const renderBookingsList = (bookings, status) => {
    if (bookings.length === 0) {
      const emptyMsg = status === 'pending' 
        ? 'No pending booking requests.' 
        : `No ${status} bookings.`;
      return (
        <div className="no-pending-bookings">
          <p>{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="pending-bookings-list">
        {bookings.map((booking) => (
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

            {status === 'pending' && (
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
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading && pendingBookings.length === 0 && approvedBookings.length === 0 && rejectedBookings.length === 0) {
    return <div className="admin-loading">Loading bookings...</div>;
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
              {pendingBookings.length} Pending
            </span>
          </div>

          <div className="booking-status-tabs">
            <button
              className={`status-tab ${bookingTab === 'pending' ? 'active' : ''}`}
              onClick={() => setBookingTab('pending')}
            >
              Pending ({pendingBookings.length})
            </button>
            <button
              className={`status-tab ${bookingTab === 'approved' ? 'active' : ''}`}
              onClick={() => setBookingTab('approved')}
            >
              Approved ({approvedBookings.length})
            </button>
            <button
              className={`status-tab ${bookingTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setBookingTab('rejected')}
            >
              Rejected ({rejectedBookings.length})
            </button>
          </div>

          {error && <div className="admin-error-message">{error}</div>}

          {bookingTab === 'pending' && renderBookingsList(pendingBookings, 'pending')}
          {bookingTab === 'approved' && renderBookingsList(approvedBookings, 'approved')}
          {bookingTab === 'rejected' && renderBookingsList(rejectedBookings, 'rejected')}
        </>
      )}
    </div>
  );
}

export default AdminApproval;
